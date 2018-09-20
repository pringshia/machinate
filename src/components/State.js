import React, { Component } from "react";
import PropTypes from "prop-types";
import External from "./External";
import { createTransitionComponent } from "../helpers";

class State extends Component {
  isUnmounted = false;
  constructor(props, context) {
    super(props, context);
    context.machine._registerComponentForUpdates(this);

    this.transientMethods = context.machine.scoped(
      context.scope,
      this.isActive
    );
    this.persistentMethods = this.context.machine.scoped(
      context.scope,
      () => true
    );
    this.Transition = createTransitionComponent(
      this.transientMethods.transition
    );

    this.External = ({ ...props }) => (
      <External
        key={props.doNotRefresh ? undefined : context.machine.lastForceTime()}
        checkBlacklisted={context.machine.isTriggerBlacklisted}
        {...props}
      />
    );
  }
  isActive = () => {
    return !this.isUnmounted;
  };
  resolvedDomainName = () => {
    return this.props.of.split(".")[0];
  };
  componentWillUnmount() {
    this.context.machine._unregisterComponentForUpdates(this);
    this.isUnmounted = true;
  }
  getActiveState = () => {
    const {
      machine: { getState }
    } = this.context;
    const fullName = this.props.of; // maybe pass through helpers/resolveSubDomain here
    const [resolvedDomainName, stateName] = fullName.split(".");
    const stateInfo = getState(resolvedDomainName);
    if (!stateInfo) return null;

    if (stateName !== stateInfo.state) return null;

    return stateInfo;
  };
  render() {
    const {
      machine: { external }
    } = this.context;
    const ifInactive =
      (this.props.ifInactive && this.props.ifInactive()) || null;

    const stateInfo = this.getActiveState();
    if (!stateInfo) return ifInactive;

    return (
      this.props.children({
        data: stateInfo.data,
        ...this.transientMethods,
        persistent: {
          ...this.persistentMethods
        },

        external: (...args) => {
          this.context.machine._registerComponentForUpdates(this);
          return external(this.scoped)(...args);
        },

        Transition: this.Transition,
        External: this.External
      }) || null
    );
  }
}

State.contextTypes = {
  scope: PropTypes.array,
  machine: PropTypes.object
};

export default State;
