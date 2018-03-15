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

    if (props.configure) {
      props.configure(machine);
    }

    machine.addListener("force-state", () => {
      this.forced = true;
      this.forceUpdate();
    });

    this.state = { machine };
  }
  componentDidUpdate() {
    if (this.forced) {
      this.forced = false;
      this.forceUpdate(); // update context value
    }
  }
  getChildContext() {
    return {
      machine: this.state.machine,
      scope: [],
      forced: !!this.forced,
      lastForceTime: this.state.machine.lastForceTime()
    };
  }
  createMachine(scheme, initialState) {
    // TODO: Implement
    return null;
  }
  render() {
    return this.props.children || null;
  }
}

Machinate.propTypes = {
  scheme: PropTypes.object.isRequired,
  initial: PropTypes.object.isRequired,
  configure: PropTypes.func
};

Machinate.childContextTypes = {
  machine: PropTypes.object,
  scope: PropTypes.array,
  forced: PropTypes.bool,
  lastForceTime: PropTypes.any
};

Machinate.contextTypes = {
  machine: PropTypes.object
};

export default Machinate;
