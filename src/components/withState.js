import React from "react";
import PropTypes from "prop-types";
import hoistStatics from "hoist-non-react-statics";
import State from "./State";

const withState = (stateName, Component) => {
  const C = props => {
    const { wrappedComponentRef, ...remainingProps } = props;
    return (
      <State
        of={stateName}
        children={stateComponentProps => (
          <Component
            {...remainingProps}
            {...stateComponentProps}
            ref={wrappedComponentRef}
          />
        )}
      />
    );
  };

  C.displayName = `withState(${Component.displayName || Component.name})`;
  C.WrappedComponent = Component;
  C.propTypes = {
    wrappedComponentRef: PropTypes.func
  };

  return hoistStatics(C, Component);
};

export default withState;
