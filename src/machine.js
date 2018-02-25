import React from "react";
import PropTypes from "prop-types";
import createGraph from "./graph";

import DomainState from "./components/DomainState";

const isTransitionable = (scheme, currentState, toState) => {
  // console.log(toState);
  const [toDomainName] = toState.split(".");

  const domainInfo = scheme[toDomainName];
  if (!domainInfo.deps) return true;

  const deps = Object.keys(domainInfo.deps);
  return deps.every(dep => {
    const [domainName, stateName] = dep.split(".");
    return Boolean(
      currentState[domainName] && currentState[domainName].state === stateName
    );
  });
};

const createMachine = function(schema, state, parentMachine) {
  let components = [];
  const rootMachine = parentMachine
    ? parentMachine.rootMachine || parentMachine
    : null;

  const submachines = [];

  // TODO: throw if scheme or initial state is missing

  const depGraph = createGraph(schema);

  // syntax expansions
  schema = Object.entries(schema).reduce((obj, [domainName, value]) => {
    if (Array.isArray(value)) {
      obj[domainName] = { states: value };
    } else {
      obj[domainName] = value;
    }
    return obj;
  }, {});

  const expandStateSyntax = state =>
    Object.entries(state).reduce((obj, [domainName, value]) => {
      if (typeof value === "string") {
        obj[domainName] = { state: value };
      } else {
        obj[domainName] = value;
      }
      return obj;
    }, {});

  state = expandStateSyntax(state);

  const getDomainInfo = domainName =>
    domainName ? schema[domainName] : schema;

  const getState = domainName => {
    return JSON.parse(
      JSON.stringify(domainName ? state[domainName] || null : state)
    );
  };

  const setState = nextState => {
    state = nextState;
    _updateAll();
  };

  const resolveSubdomain = (scope, domainName) => {
    const variations = ["", ...scope]
      .map((_, idx, array) => array.slice(0, array.length - idx))
      .map(possibleScopes =>
        [...possibleScopes.slice(1), domainName].join("/")
      );

    const possibilities = variations.filter(variation =>
      state.hasOwnProperty(variation)
    );

    if (possibilities.length > 1) {
      console.warn(
        `Possible ambiguity in transitioning within domain named '${domainName}'.` +
          ` Machinate will transition to the most specific one, '${
            possibilities[0]
          }', but you may have meant to transition to ${possibilities
            .slice(1)
            .map(name => `'${name}'`)
            .join(
              " or "
            )}. It is recommended to be more specific to avoid unintended behavior.`
      );
    }

    return possibilities[0];
  };

  const transition = (scope, domainName, stateName, payload) => {
    // TODO: resolve these names using scope:
    // console.log(scope, domainName, stateName, payload);
    // const domainName = resolveSubdomain(scope, domainName);
    const toName = domainName + "." + stateName;
    const fromName =
      state[domainName] && domainName + "." + state[domainName].state;

    if (!isTransitionable(schema, state, domainName + "." + stateName)) {
      // is throwing an error too harsh?
      // throw new Error("this state cannot be transitioned to.")
      return;
    }

    // console.log(
    //   "going from",
    //   fromName,
    //   "to",
    //   toName,
    //   depGraph.getDependents(state, fromName).map(n => n.f),
    //   depGraph.getDependents(state, toName).map(n => n.f)
    // );

    state[domainName] = {
      state: stateName,
      data: payload
    };

    // cmon dude, do it immutably
    depGraph
      .getDependents(state, fromName)
      .map(n => n.f)
      .forEach(domain => {
        delete state[domain];
      });

    depGraph.getDependents(state, toName).forEach(node => {
      if (node.ts[0].name) {
        transition(scope, node.f, node.ts[0].name);
      }
    });

    // should dependency components be included in this force update as well?
    const comps = components.filter(
      comp => comp.props._config.domainName === domainName
    );
    comps.forEach(comp => comp.forceUpdate());

    // _updateAll();
  };

  const _updateAll = () => {
    // - is there a better, more efficient way to do this?
    // - is this idiomatic react? should I just setState() on sub-components?
    components.forEach(comp => comp.forceUpdate());
  };

  const go = (scope, notation, payload) => _ => {
    const [domainName, stateName] = notation.split(".");
    transition(scope, domainName, stateName, payload);
  };

  const componentForDomain = (scope, domainName) => {
    // const resolvedDomain = [...scope, domainName].join("/");

    // console.log("name", resolvedDomain, getState()[resolvedDomain]);
    const generatedPropTypes = Object.values(
      getDomainInfo(domainName).states || {}
    ).reduce((obj, stateName) => {
      obj[stateName] = PropTypes.func.isRequired;
      return obj;
    }, {});

    const Wrapper = props => (
      <DomainState
        _config={{
          onAdd: ref => components.push(ref),
          onRemove: ref =>
            (components = components.filter(comp => comp !== ref)),
          domainName,
          machine: {
            transition: (...args) => transition(scope, ...args),
            go: (...args) => go(scope, ...args),
            getState
          }
        }}
        {...props}
      />
    );
    Wrapper.displayName = domainName + "[Domain]";
    Wrapper.propTypes = generatedPropTypes;

    return Wrapper;
  };

  const registerSubmachine = (scope, initialState) => {
    const prefixedInitialState = Object.entries(
      expandStateSyntax(initialState)
    ).reduce((obj, [key, value]) => {
      const prefixedKey = [...scope, key].join("/");
      obj[prefixedKey] = value;
      return obj;
    }, {});
    state = Object.assign({}, state, prefixedInitialState);
  };

  const removeSubmachine = scope => {
    const prefix = scope.join("/") + "/";
    state = Object.entries(state).reduce((obj, [key, value]) => {
      if (!key.startsWith(prefix)) {
        obj[key] = value;
      }
      return obj;
    }, {});
  };

  const createdMachine = {
    getState,
    setState,
    transition,

    getDomainInfo,
    componentForDomain,
    getComponents: () => components,
    rootMachine,
    registerSubmachine,
    removeSubmachine,
    getSubmachines: () => submachines
  };

  if (parentMachine) {
    rootMachine.registerSubmachine(createdMachine);
  }

  return createdMachine;
};

export { createMachine, isTransitionable };
