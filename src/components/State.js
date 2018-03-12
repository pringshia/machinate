import React, { Component } from "react";
import PropTypes from "prop-types";

class Transition extends Component {
  componentWillMount() {
    this.props.transition(this.props.to, this.props.data);
  }
  render() {
    return this.props.children || null;
  }
}

class State extends Component {
  constructor(props, context) {
    super(props, context);
    context.machine._registerComponentForUpdates(this);
    const transition = context.machine.transition;
    this.transition = (...args) =>
      this.getActiveState() && transition(this.context.scope, ...args);
    this.Transition = ({ transition, ...props }) => (
      <Transition transition={this.transition} {...props} />
    );
  }
  resolvedDomainName = () => {
    return this.props.for.split(".")[0];
  };
  componentWillUnmount() {
    this.context.machine._unregisterComponentForUpdates(this);
  }
  getActiveState = () => {
    const { machine: { getState } } = this.context;
    const fullName = this.props.for; // maybe pass through helpers/resolveSubDomain here
    const [resolvedDomainName, stateName] = fullName.split(".");
    const stateInfo = getState(resolvedDomainName);
    if (!stateInfo) return null;

    if (stateName !== stateInfo.state) return null;

    return stateInfo;
  };
  render() {
    const { machine: { transition, go, update }, scope } = this.context;

    const stateInfo = this.getActiveState();
    if (!stateInfo) return null;

    return (
      this.props.children({
        data: stateInfo.data,
        transition: this.transition, // only transition if state is active
        go: (...args) => this.getActiveState() && go(scope, ...args),
        globalTransition: (...args) => transition(scope, ...args), // always transition
        update: (...args) => this.getActiveState() && update(scope, ...args),
        Transition: this.Transition
      }) || null
    );
  }
}

State.contextTypes = {
  scope: PropTypes.array,
  machine: PropTypes.object
};

export default State;
