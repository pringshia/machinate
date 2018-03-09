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
import eventemitter from "./emitter";

const createMachine = function(schema, state) {
  let components = [];
  const submachines = [];
  const emitter = eventemitter();

  if (!schema) {
    throw new Error("Machine must be initialized with a scheme");
  }
  if (!state) {
    throw new Error("Machine must be initialized with an initial state");
  }

  emitter.emit("init-state", { state });

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

  const _setState = nextState => {
    state = nextState;
    emitter.emit("set-state", { state });
  };

  const setState = nextState => {
    state = nextState;
    emitter.emit("force-state", { state });
  };

  const transition = (
    scope,
    domainName,
    stateName,
    payload,
    isTriggered = false
  ) => {
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
    const schematicFromName = fromName && fromName.split("/").slice(-1)[0];

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

    log(
      [
        "going from",
        fromName,
        "to",
        toName,
        "with payload",
        payload,
        "and dependents",
        depGraph.getDependents(state, fromName).map(n => n.f),
        depGraph.getDependents(state, toName).map(n => n.f)
      ].join(" ")
    );

    const oldState = state[resolvedDomainName];

    _setState({
      ...state,
      ...{
        [resolvedDomainName]: {
          state: stateName,
          data: payload
        }
      }
    });

    const dependentDomainsToAdd = depGraph
      .getDependents(state, schematicToName)
      .map(node => ({ domain: node.f, state: node.ts[0] && node.ts[0].name }));

    const dependentDomainsToRemove = depGraph
      .getDependents(state, schematicFromName)
      .map(n => n.f);

    const optimizedDomainsToRemove = dependentDomainsToRemove
      .filter(domain => {
        const overlap = dependentDomainsToAdd.find(x => x.domain === domain);
        if (
          overlap &&
          state[prefix + domain] &&
          overlap.state === state[prefix + domain].state
        ) {
          return false;
        }
        return true;
      })
      .map(domain => prefix + domain);

    const optimizedDomainsToAdd = dependentDomainsToAdd.filter(toAdd => {
      const overlap = dependentDomainsToRemove.find(
        domain => domain === toAdd.domain
      );
      if (overlap && overlap === toAdd.domain) {
        return false;
      }
      return true;
    });

    optimizedDomainsToAdd.forEach(toAdd => {
      console.log("triggering " + toAdd.domain + "." + toAdd.state);
      // ponder: we are recursing before updating the state below, is that ok?
      emitter.emit("triggered-add", { ...toAdd });
      transition(prefixArray, toAdd.domain, toAdd.state, undefined, true);
    });

    _setState(
      Object.entries(state).reduce((obj, [key, value]) => {
        if (!optimizedDomainsToRemove.includes(key)) {
          obj[key] = value;
        }
        emitter.emit("triggered-remove", { domain: key });
        return obj;
      }, {})
    );

    // should dependency components be included in this force update as well?
    if (schematicToName !== schematicFromName || payload !== oldState.data) {
      const comps = components.filter(comp => {
        const fullName = _componentFullName(comp);
        return fullName === resolvedDomainName;
      });
      comps.forEach(comp => comp.forceUpdate());
    }

    if (isTriggered) {
      emitter.emit("transition-triggered", {
        fromName,
        toName,
        payload,
        state
      });
    } else {
      emitter.emit("transition", { fromName, toName, payload, state });
    }
  };

  const _componentFullName = comp => comp.resolvedDomainName();
  // const _componentFullName = (scope, domainName) =>
  //   [...scope, domainName].join("/");

  const go = (scope, notation, payload) => _ => {
    const [domainName, stateName] = notation.split(".");
    transition(scope, domainName, stateName, payload);
  };

  const _registerComponentForUpdates = ref => {
    components.push(ref);
  };

  const _unregisterComponentForUpdates = ref => {
    components = components.filter(comp => comp !== ref);
  };

  const componentForDomain = (scope, domainName) => {
    const generatedPropTypes = Object.values(
      getDomainInfo(domainName).states || {}
    ).reduce((obj, stateName) => {
      obj[stateName] = PropTypes.func.isRequired;
      return obj;
    }, {});

    const Wrapper = props => (
      <DomainState
        _config={{
          onAdd: _registerComponentForUpdates,
          onRemove: _unregisterComponentForUpdates,
          scope,
          domainName,
          machine: {
            transition: (...args) => transition(scope, ...args),
            go: (...args) => go(scope, ...args),
            log: log,
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

    _setState(Object.assign({}, state, prefixedInitialState));

    // Perhaps updates should be moved into _setState instead. Fix bug where after
    // a submachine was reregistered with a different initial value, the component
    // wasn't updating in the UI.
    // const componentsToUpdate = components.filter(comp =>
    //   _componentFullName(comp).startsWith([...scope, ""].join("/"))
    // );
    // componentsToUpdate.forEach(comp => comp.forceUpdate());
  };

  const removeSubmachine = scope => {
    const prefix = scope.join("/") + "/";
    _setState(
      Object.entries(state).reduce((obj, [key, value]) => {
        if (!key.startsWith(prefix)) {
          obj[key] = value;
        }
        return obj;
      }, {})
    );
  };

  const log = msg => emitter.emit("log", msg);

  const createdMachine = {
    getState,
    setState,
    transition,
    go,

    getDomainInfo,
    componentForDomain,
    getComponents: () => components,
    _registerComponentForUpdates,
    _unregisterComponentForUpdates,
    registerSubmachine,
    removeSubmachine,
    getSubmachines: () => submachines,

    addListener: emitter.addListener,
    removeListener: emitter.removeListener,
    log
  };

  return createdMachine;
};

export { createMachine, isTransitionable };
