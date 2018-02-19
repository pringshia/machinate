import React, { Component } from "react";

class DomainState extends Component {
  constructor(props) {
    super(props);
    this.props._config.onAdd(this);
  }
  componentWillUnmount() {
    this.props._config.onRemove(this);
  }
  render() {
    const {
      domainName,
      machine: { getState, transition, go }
    } = this.props._config;
    const stateInfo = getState(domainName);
    if (!stateInfo) return null;

    const stateName = stateInfo.state;

    if (!this.props[stateName])
      throw new Error(`State '${stateName}' not defined in '${domainName}'`);
    return this.props[stateName](stateInfo.data, {
      transition: transition,
      go: go
    });
  }
}

export default DomainState;
