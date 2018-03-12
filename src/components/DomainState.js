import React, { Component } from "react";
import PropTypes from "prop-types";
import State from "./State";

class DomainState extends Component {
  constructor(props, context) {
    super(props, context);
    context.machine._registerComponentForUpdates(this);
  }
  componentWillUnmount() {
    this.context.machine._unregisterComponentForUpdates(this);
  }
  resolvedDomainName = () => {
    const { forDomain: domainName } = this.props;
    const { scope } = this.context;
    const resolvedDomainName = [...scope, domainName].join("/");
    return resolvedDomainName;
  };
  render() {
    const { forDomain: domainName } = this.props;
    const { scope, machine: { getState } } = this.context;
    const resolvedDomainName = [...scope, domainName].join("/");
    const stateInfo = getState(resolvedDomainName);
    if (!stateInfo) return null;

    const stateName = stateInfo.state;

    if (!this.props[stateName])
      throw new Error(`State '${stateName}' not defined in '${domainName}'`);
    return (
      <State
        key={resolvedDomainName + "." + stateName}
        for={resolvedDomainName + "." + stateName}
        children={stateComponentProps =>
          this.props[stateName](stateComponentProps)
        }
      />
    );
  }
}

DomainState.contextTypes = {
  scope: PropTypes.array,
  machine: PropTypes.object
};

export default DomainState;
