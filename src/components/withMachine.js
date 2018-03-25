import React from "react";
import PropTypes from "prop-types";
import External from "./External";
import hoistStatics from "hoist-non-react-statics";
import { createTransitionComponent } from "../helpers";
import MachineConsumer from "./MachineConsumer";

const withMachine = Component => {
  const C = props => {
    const { wrappedComponentRef, ...remainingProps } = props;
    return (
      <MachineConsumer>
        {renderProps => (
          <Component
            ref={wrappedComponentRef}
            {...renderProps}
            {...remainingProps}
          />
        )}
      </MachineConsumer>
    );
  };

  C.displayName = `withMachine(${Component.displayName || Component.name})`;
  C.WrappedComponent = Component;
  C.propTypes = {
    wrappedComponentRef: PropTypes.func
  };

  return hoistStatics(C, Component);
};

export default withMachine;
