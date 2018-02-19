import React, { Component } from "react";

class SlotState extends Component {
  constructor(props) {
    super(props);
    this.props._config.onAdd(this);
  }
  componentWillUnmount() {
    this.props._config.onRemove(this);
  }
  render() {
    const {
      slotName,
      machine: { getState, transition, go }
    } = this.props._config;
    const stateInfo = getState(slotName);
    if (!stateInfo) return null;

    const stateName = stateInfo.state;

    if (!this.props[stateName])
      throw new Error(`State '${stateName}' not defined in '${slotName}'`);
    return this.props[stateName](stateInfo.details, {
      transition: transition,
      go: go
    });
  }
}

export default SlotState;
