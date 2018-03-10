import React from "react";
import PropTypes from "prop-types";
import hoistStatics from "hoist-non-react-statics";

const withMachine = Component => {
  const C = (props, context) => {
    const { wrappedComponentRef, ...remainingProps } = props;

    const machineProps = context.machine.scoped(context.scope);

    return (
      <Component
        {...remainingProps}
        ref={wrappedComponentRef}
        {...machineProps}
      />
    );
  };

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
