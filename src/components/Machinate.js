import React from "react";
import PropTypes from "prop-types";
import { createMachine } from "../machine";

class Machinate extends React.Component {
  constructor(props, context) {
    super(props);

    const machine = createMachine(
      props.scheme,
      props.initial,
      context && context.machine // pass the parent machine if available
    );

    machine.addListener("force-state", () => this.forceUpdate());

    this.state = { machine };
  }
  createMachine(scheme, initialState) {
    // TODO: Implement
    return null;
  }
  render() {
    return this.props.children || null;
  }
  getChildContext() {
    return {
      machine: this.state.machine,
      scope: []
    };
  }
}

Machinate.propTypes = {
  scheme: PropTypes.object.isRequired,
  initial: PropTypes.object.isRequired
};

Machinate.childContextTypes = {
  machine: PropTypes.object,
  scope: PropTypes.array
};

Machinate.contextTypes = {
  machine: PropTypes.object
};

export default Machinate;
