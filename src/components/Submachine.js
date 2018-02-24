import { Component } from "react";
import PropTypes from "prop-types";

class Submachine extends Component {
  getChildContext() {
    const existingScope = (this.context && this.context.scope) || [];
    return {
      scope: existingScope.concat([this.props.id])
    };
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

export default Submachine;
