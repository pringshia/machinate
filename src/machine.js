import React from "react";
import PropTypes from "prop-types";
import createGraph from "./graph";
import {
  expandSchemeSyntax,
  expandStateSyntax,
  resolveSubdomain,
  isTransitionable
} from "./helpers";

import DomainState from "./components/DomainState";

const createMachine = function(schema, state, parentMachine) {
  let components = [];
  const rootMachine = parentMachine
    ? parentMachine.rootMachine || parentMachine
    : null;
  const submachines = [];
  let onSetState = () => null;

  // TODO: throw if scheme or initial state is missing
  if (!schema) {
    throw new Error("Machine must be initialized with a scheme");
  }
  if (!state) {
    throw new Error("Machine must be initialized with an initial state");
  }

  const depGraph = createGraph(schema);

  // syntax expansions
  schema = expandSchemeSyntax(schema);
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
    onSetState();
  };

  const transition = (scope, domainName, stateName, payload) => {
    // TODO: resolve these names using scope:
    // console.log(scope, domainName, stateName, payload);
    const {
      prefix,
      prefixArray,
      fullName: resolvedDomainName
    } = resolveSubdomain(state, scope, domainName);
    const schematicToName =
      domainName.split("/").slice(-1)[0] + "." + stateName;
    const toName = resolvedDomainName + "." + stateName;

    const fromName =
      state[resolvedDomainName] &&
      resolvedDomainName + "." + state[resolvedDomainName].state;

    const unresolvedFromName = fromName && fromName.split("/").slice(-1)[0];

    if (
      !isTransitionable(
        prefixArray,
        schema,
        state,
        schematicToName + "." + stateName
      )
    ) {
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
    //   "with payload",
    //   payload,
    //   "and dependents",
    //   depGraph.getDependents(state, fromName).map(n => n.f),
    //   depGraph.getDependents(state, toName).map(n => n.f)
    // );

    state[resolvedDomainName] = {
      state: stateName,
      data: payload
    };

    const domainsToRemove = depGraph
      .getDependents(state, unresolvedFromName)
      .map(n => n.f)
      .map(domain => prefix + domain);

    state = Object.entries(state).reduce((obj, [key, value]) => {
      if (!domainsToRemove.includes(key)) {
        obj[key] = value;
      }
      return obj;
    }, {});

    depGraph.getDependents(state, schematicToName).forEach(node => {
      if (node.ts[0].name) {
        transition(prefixArray, node.f, node.ts[0].name);
      }
    });

    // should dependency components be included in this force update as well?
    const comps = components.filter(comp => {
      const fullName = [
        ...comp.props._config.scope,
        comp.props._config.domainName
      ].join("/");
      return fullName === resolvedDomainName;
    });
    comps.forEach(comp =>
      console.log(
        "Updating",
        [...comp.props._config.scope, comp.props._config.domainName].join("/")
      )
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

    onSetState: fn => (onSetState = fn),

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
