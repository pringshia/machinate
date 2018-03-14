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
  isUnmounted = false;
  constructor(props, context) {
    super(props, context);
    context.machine._registerComponentForUpdates(this);

    this.transientMethods = context.machine.scoped(
      context.scope,
      this.isActive
    );

    this.Transition = ({ ...props }) => (
      <Transition transition={this.transientMethods.transition} {...props} />
    );
  }
  isActive = () => {
    return !this.isUnmounted;
  };
  resolvedDomainName = () => {
    return this.props.for.split(".")[0];
  };
  componentWillUnmount() {
    this.context.machine._unregisterComponentForUpdates(this);
    this.isUnmounted = true;
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
    const { machine: { external }, scope } = this.context;

    const persistentMethods = this.context.machine.scoped(scope, () => true);

    const stateInfo = this.getActiveState();
    if (!stateInfo) return null;

    return (
      this.props.children({
        data: stateInfo.data,
        ...this.transientMethods,
        persistent: {
          ...persistentMethods
        }, // always transition

        external: external(this.scoped),

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
