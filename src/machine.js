import React from "react";
import PropTypes from "prop-types";
import createGraph from "./graph";

import DomainState from "./components/DomainState";

const createMachine = function(schema, state) {
  let components = [];
  let prevState = null;
  const depGraph = createGraph(schema);

  // syntax expansions
  schema = Object.entries(schema).reduce((obj, [slotName, value]) => {
    if (Array.isArray(value)) {
      obj[slotName] = { states: value };
    } else {
      obj[slotName] = value;
    }
    return obj;
  }, {});

  state = Object.entries(state).reduce((obj, [slotName, value]) => {
    if (typeof value === "string") {
      obj[slotName] = { state: value };
    } else {
      obj[slotName] = value;
    }
    return obj;
  }, {});

  const getDomainInfo = slotName => (slotName ? schema[slotName] : schema);

  const getState = slotName => {
    return JSON.parse(
      JSON.stringify(slotName ? state[slotName] || null : state)
    );
  };

  const setState = nextState => {
    state = nextState;
    _updateAll();
  };

  const transition = (slotName, stateName, payload) => {
    const toName = slotName + "." + stateName;
    const fromName = state[slotName] && slotName + "." + state[slotName].state;

    console.log(
      "going from",
      fromName,
      "to",
      toName,
      depGraph.getDependents(state, fromName).map(n => n.f),
      depGraph.getDependents(state, toName).map(n => n.f)
    );

    prevState = getState();

    state[slotName] = {
      state: stateName,
      data: payload
    };

    // cmon dude, do it immutably
    depGraph
      .getDependents(state, fromName)
      .map(n => n.f)
      .forEach(slot => {
        delete state[slot];
      });

    depGraph.getDependents(state, toName).forEach(node => {
      if (node.ts[0].name) {
        transition(node.f, node.ts[0].name);
      }
    });

    _updateAll();
  };

  const _updateAll = () => {
    // - is there a better, more efficient way to do this?
    // - is this idiomatic react? should I just setState() on sub-components?
    components.forEach(comp => comp.forceUpdate());
  };

  const go = (notation, payload) => _ => {
    const [slotName, stateName] = notation.split(".");
    transition(slotName, stateName, payload);
  };

  const componentForDomain = slotName => {
    const generatedPropTypes = Object.values(
      getDomainInfo(slotName).states || {}
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
          slotName,
          machine: { transition, go, getState }
        }}
        {...props}
      />
    );
    Wrapper.displayName = slotName + "[Domain]";
    Wrapper.propTypes = generatedPropTypes;

    return Wrapper;
  };

  return {
    getState,
    getPrevState: () => prevState,
    setState,
    transition,

    getDomainInfo,
    componentForDomain,
    getComponents: () => components
  };
};

export { createMachine };
