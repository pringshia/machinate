import React, { Component } from "react";
import PropTypes from "prop-types";
import ExternalComp from "./External";
import { createTransitionComponent } from "../helpers";

class MachineConsumer extends Component {
  constructor(props, context) {
    super(props, context);
    this.persistentMethods = context.machine.scoped(context.scope, () => true);
    const Transition = createTransitionComponent(
      this.persistentMethods.transition
    );

    const External = ({ ...props }) => (
      <ExternalComp
        checkBlacklisted={context.machine.isTriggerBlacklisted}
        {...props}
      />
    );

    this.machineProps = {
      ...this.persistentMethods,
      Transition,
      External,
      external: context.machine.external(context.scope),
      lastForceTime: context.machine.lastForceTime
    };
  }
  render() {
    return this.props.children({ ...this.machineProps });
  }
}

export default MachineConsumer;

MachineConsumer.contextTypes = {
  scope: PropTypes.array,
  machine: PropTypes.object
};
