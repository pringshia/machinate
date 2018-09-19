import { Component } from "react";
import PropTypes from "prop-types";

class External extends Component {
  // componentDidMount() {
  //   this.context.machine.addListener(
  //     "blacklist-set",
  //     this.handleExternalsChanged
  //   );
  // }

  // componentWillUnmount() {
  //   this.context.machine.removeListener(
  //     "blacklist-set",
  //     this.handleExternalsChanged
  //   );
  // }

  // handleExternalsChanged = () => {
  //   console.log("here");
  //   this.forceUpdate();
  // };

  // TODO: Component needs to re-render if external is updated.
  render() {
    const { emitter, getBlacklist } = this.context.machine;
    const { name } = this.props;

    if (this.props.checkBlacklisted(name)) {
      emitter.emit("external-blocked", {
        externalName: name,
        blockedBy: getBlacklist().filter(regex => !!name.match(regex))
      });

      return (
        (this.props.fallback && {
          ...this.props.fallback,
          key: this.props.fallback.key || this.context.lastForceTime
        }) ||
        null
      );
    } else {
      emitter.emit("external-executed", { externalName: name });
      return this.props.children || null;
    }
  }
}

export default External;

External.contextTypes = {
  machine: PropTypes.object,
  lastForceTime: PropTypes.any
};
