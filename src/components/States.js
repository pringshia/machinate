import React from "react";
import PropTypes from "prop-types";

class States extends React.Component {
  // shouldComponentUpdate() {
  //   console.log("Should update?", this.context.scope.join("/"), this.props.for);
  //   return true;
  // }

  // componentWillUnmount() {
  //   console.log(
  //     "States unmounting",
  //     this.context.scope.join("/"),
  //     this.props.for
  //   );
  // }
  componentWillMount() {
    const { of: forDomain } = this.props;
    const { machine, scope } = this.context;
    this.DomainState = machine.componentForDomain(scope, forDomain);
  }
  render() {
    const { of: forDomain, ...props } = this.props;
    const { DomainState } = this;
    const { machine } = this.context;

    return (
      <DomainState
        key={forDomain + "-" + machine.lastForceTime()}
        forDomain={forDomain}
        {...props}
      />
    );
  }
}

States.propTypes = {
  of: PropTypes.string.isRequired
};

States.contextTypes = {
  machine: PropTypes.object,
  scope: PropTypes.array
};

export default States;
