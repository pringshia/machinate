import { Component } from "react";
import PropTypes from "prop-types";

class External extends Component {
  render() {
    return (
      (this.props.checkBlacklisted(this.props.name)
        ? this.props.fallback && {
            ...this.props.fallback,
            key: this.context.lastForceTime
          }
        : this.props.children) || null
    );
  }
}

export default External;

External.contextTypes = {
  machine: PropTypes.object,
  lastForceTime: PropTypes.any
};
