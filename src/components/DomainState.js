import React, { Component } from "react";
import PropTypes from "prop-types";
import State from "./State";

class DomainState extends Component {
  constructor(props) {
    super(props);
    this.props._config.onAdd(this);
  }
  componentWillUnmount() {
    this.props._config.onRemove(this);
  }
  resolvedDomainName = () => {
    const { domainName, machine: { getState } } = this.props._config;
    const { scope } = this.context;
    const resolvedDomainName = [...scope, domainName].join("/");
    return resolvedDomainName;
  };
  render() {
    const { domainName, machine: { getState } } = this.props._config;
    const { scope } = this.context;
    const resolvedDomainName = [...scope, domainName].join("/");
    const stateInfo = getState(resolvedDomainName);
    if (!stateInfo) return null;

    const stateName = stateInfo.state;

    if (!this.props[stateName])
      throw new Error(`State '${stateName}' not defined in '${domainName}'`);
    return (
      <State
        key={resolvedDomainName + "." + stateName}
        of={resolvedDomainName + "." + stateName}
        _config={this.props._config}
        children={stateComponentProps =>
          this.props[stateName](stateComponentProps)
        }
      />
    );
  }
}

DomainState.contextTypes = {
  scope: PropTypes.array
};

export default DomainState;
