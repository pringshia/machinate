import { Component } from "react";
import PropTypes from "prop-types";

class State extends Component {
  constructor(props, context) {
    super(props, context);
    context.machine._registerComponentForUpdates(this);
    this.transition = context.machine.transition;
  }
  resolvedDomainName = () => {
    return this.props.of.split(".")[0];
  };
  componentWillUnmount() {
    this.context.machine._unregisterComponentForUpdates(this);
  }
  getActiveState = () => {
    const { machine: { getState } } = this.context;
    const fullName = this.props.of; // maybe pass through helpers/resolveSubDomain here
    const [resolvedDomainName, stateName] = fullName.split(".");
    const stateInfo = getState(resolvedDomainName);
    if (!stateInfo) return null;

    if (stateName !== stateInfo.state) return null;

    return stateInfo;
  };
  render() {
    const { machine: { transition, go }, scope } = this.context;

    const stateInfo = this.getActiveState();
    if (!stateInfo) return null;

    return this.props.children({
      data: stateInfo.data,
      transition: (...args) =>
        this.getActiveState() && transition(scope, ...args), // only transition if state is active
      go: (...args) => this.getActiveState() && go(scope, ...args)
    });
  }
}

State.contextTypes = {
  scope: PropTypes.array,
  machine: PropTypes.object
};

export default State;
