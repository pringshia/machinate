import React from "react";
import Dag from "./dag";
import PropTypes from "prop-types";

import DomainState from "./components/DomainState";

const createMachine = function(schema, state) {
  let components = [];
  const dag = new Dag();

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

  // setup dag
  const list = Object.entries(schema)
    .filter(
      ([slotName, info]) => info.deps && Object.keys(info.deps).length > 0
    )
    .forEach(([slotName, info]) => {
      Object.entries(info.deps).map(([dep, initialState]) => {
        // console.log(slotName, dep);
        dag.add(slotName, dep, initialState);
        // console.log(dag);
      });
    });

  // if toState has no edges, return empty array
  // if toState has edges, return the node, plus it's dependents
  const getDependents = toState => {
    const childDependents = dag.edgesTo(toState).edges[toState];

    const flatMap = function(arr, lambda) {
      return Array.prototype.concat.apply([], arr.map(lambda));
    };

    return !childDependents
      ? []
      : flatMap(childDependents, node => [
          node,
          ...getDependents(state[node.f] && node.f + "." + state[node.f].state)
        ]);
  };

  const getSlotsDef = slotName => (slotName ? schema[slotName] : schema);

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
    // need to add support for dependencies via perhaps a DAG/dep graph?

    const toName = slotName + "." + stateName;
    const fromName = state[slotName] && slotName + "." + state[slotName].state;

    console.log(
      "going from",
      fromName,
      "to",
      toName,
      getDependents(fromName).map(n => n.f),
      getDependents(toName).map(n => n.f)
    );

    state[slotName] = {
      state: stateName,
      details: payload
    };

    // cmon dude, do it immutably
    getDependents(fromName)
      .map(n => n.f)
      .forEach(slot => {
        delete state[slot];
      });

    getDependents(toName).forEach(node => {
      if (node.ts[0].name) {
        transition(node.f, node.ts[0].name);
      }
    });

    _updateAll();
  };

  const _updateAll = () => {
    // - is there a better, more efficient way to do this?
    // - is this idiomatic react?
    components.forEach(comp => comp.forceUpdate());
  };

  // const forState = notation => {
  //   const Slot = createReactClass({
  //     getInitialState: function() {
  //       components.push(this);
  //       return {};
  //     },
  //     componentWillUnmount: function() {
  //       components = components.filter(comp => comp !== this);
  //     },
  //     render: function() {
  //       const [slotName, stateName] = notation.split(".");
  //       const stateInfo = getState(slotName);
  //       if (!stateInfo) return null;
  //       if (stateInfo.state !== stateName) return null;

  //       return this.props.children(stateInfo.details);
  //     }
  //   });
  //   return Slot;
  // };

  const go = (notation, payload) => _ => {
    const [slotName, stateName] = notation.split(".");
    transition(slotName, stateName, payload);
  };

  const forSlot = slotName => {
    const generatedPropTypes = Object.values(
      getSlotsDef(slotName).states || {}
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
    getSlotsDef,
    forSlot,
    // forState,
    transition,
    setState,
    getComponents: () => components
  };
};

export { createMachine };
