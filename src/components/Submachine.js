import { Component } from "react";
import PropTypes from "prop-types";

class Submachine extends Component {
  getChildContext() {
    const existingScope = (this.context && this.context.scope) || [];
    return {
      scope: existingScope.concat([this.props.id])
    };
  }
  constructor(props, context) {
    super(props, context);

    context.machine.registerSubmachine(
      this.getChildContext().scope,
      props.initial
    );
  }
  componentWillUnmount() {
    this.context.machine.removeSubmachine(this.getChildContext().scope);
  }
  render() {
    return this.props.children;
  }
}

Submachine.contextTypes = {
  scope: PropTypes.array
};

Submachine.childContextTypes = {
  scope: PropTypes.array
};

Submachine.propTypes = {
  id: PropTypes.string.isRequired,
  initial: PropTypes.object.isRequired
};

export default Submachine;
