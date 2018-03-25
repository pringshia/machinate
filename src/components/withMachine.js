import React from "react";
import PropTypes from "prop-types";
import External from "./External";
import hoistStatics from "hoist-non-react-statics";
import { createTransitionComponent } from "../helpers";

const withMachine = Component => {
  class C extends React.Component {
    constructor(props, context) {
      super(props, context);
      this.persistentMethods = context.machine.scoped(
        context.scope,
        () => true
      );
      this.Transition = createTransitionComponent(
        this.persistentMethods.transition
      );

      this.External = ({ ...props }) => (
        <External
          checkBlacklisted={context.machine.isTriggerBlacklisted}
          {...props}
        />
      );
    }
    render() {
      const { wrappedComponentRef, ...remainingProps } = this.props;

      return (
        <Component
          {...remainingProps}
          ref={wrappedComponentRef}
          {...this.persistentMethods}
          Transition={this.Transition}
          External={this.External}
        />
      );
    }
  }

  C.displayName = `withMachine(${Component.displayName || Component.name})`;
  C.WrappedComponent = Component;
  C.propTypes = {
    wrappedComponentRef: PropTypes.func
  };
  C.contextTypes = {
    scope: PropTypes.array,
    machine: PropTypes.object
  };

  return hoistStatics(C, Component);
};

export default withMachine;
