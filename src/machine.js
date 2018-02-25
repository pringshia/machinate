import React from "react";
import PropTypes from "prop-types";
import createGraph from "./graph";

import DomainState from "./components/DomainState";

const isTransitionable = (scope, scheme, currentState, toState) => {
  const toDomainName = toState.split(".")[0];

  const prefix = scope.length === 0 ? "" : [scope, ""].join("/");

  const domainInfo = scheme[toDomainName];
  if (!domainInfo.deps) return true;

  const deps = Object.keys(domainInfo.deps);
  return deps.every(dep => {
    const [domainName, stateName] = dep.split(".");
    return Boolean(
      currentState[prefix + domainName] &&
        currentState[prefix + domainName].state === stateName
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
    const allVariations = ["", ...scope]
      .map((_, idx, array) => array.slice(0, array.length - idx))
      .map(possibleScopes => ({
        fullName: [...possibleScopes.slice(1), domainName].join("/"),
        prefix:
          possibleScopes.slice(1).length === 0
            ? ""
            : [...possibleScopes.slice(1), ""].join("/")
      }));

    const variations = allVariations.map(v => v.fullName);
    const prefixVariations = allVariations.map(v => v.prefix);

    const allPossibilities = allVariations.filter(variation =>
      state.hasOwnProperty(variation.fullName)
    );

    const possibilities = allPossibilities.map(p => p.fullName);
    const prefixPossibilities = allPossibilities.map(p => p.prefix);

    if (possibilities.length === 0)
      return { prefix: prefixVariations[0], fullName: variations[0] };

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
    return { prefix: prefixPossibilities[0], fullName: possibilities[0] };
  };

  const transition = (scope, domainName, stateName, payload) => {
    // TODO: resolve these names using scope:
    // console.log(scope, domainName, stateName, payload);
    const { prefix, fullName: resolvedDomainName } = resolveSubdomain(
      scope,
      domainName
    );
    const unresolvedToName = domainName + "." + stateName;
    const toName = resolvedDomainName + "." + stateName;

    const fromName =
      state[resolvedDomainName] &&
      resolvedDomainName + "." + state[resolvedDomainName].state;

    const unresolvedFromName = fromName && fromName.split("/").slice(-1)[0];

    if (!isTransitionable(scope, schema, state, domainName + "." + stateName)) {
      // is throwing an error too harsh?
      throw new Error(
        `${resolvedDomainName +
          "." +
          stateName} cannot be transitioned to, likely due to an unfullfilled dependency.`
      );
    }

    // console.log(
    //   "going from",
    //   fromName,
    //   "to",
    //   toName,
    //   depGraph.getDependents(state, fromName).map(n => n.f),
    //   depGraph.getDependents(state, toName).map(n => n.f)
    // );

    state[resolvedDomainName] = {
      state: stateName,
      data: payload
    };

    // cmon dude, do it immutably
    depGraph
      .getDependents(state, unresolvedFromName)
      .map(n => n.f)
      .forEach(domain => {
        delete state[prefix + domain];
      });

    depGraph.getDependents(state, unresolvedToName).forEach(node => {
      if (node.ts[0].name) {
        transition(scope, node.f, node.ts[0].name);
      }
    });

    // should dependency components be included in this force update as well?
    const comps = components.filter(comp => {
      const fullName = [
        ...comp.props._config.scope,
        comp.props._config.domainName
      ].join("/");
      console.log(
        fullName === resolvedDomainName,
        fullName,
        resolvedDomainName
      );
      return fullName === resolvedDomainName;
    });
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
          scope,
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
