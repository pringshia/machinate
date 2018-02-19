import React from "react";
import PropTypes from "prop-types";
import { createMachine } from "../machine";

class Machinate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      machine: createMachine(props.scheme, props.initialState)
    };
  }
  createMachine(scheme, initialState) {
    // TODO: Implement
    return null;
  }
  render() {
    return this.props.children;
  }
  getChildContext() {
    return {
      machine: this.state.machine
    };
  }
}

Machinate.propTypes = {
  scheme: PropTypes.object.isRequired,
  initialState: PropTypes.object.isRequired
};

Machinate.childContextTypes = {
  machine: PropTypes.object
};

export default Machinate;
