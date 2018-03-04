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
    const { for: forDomain } = this.props;
    const { machine, scope } = this.context;
    this.DomainState = machine.componentForDomain(scope, forDomain);
  }
  render() {
    const { for: forDomain, ...props } = this.props;
    const { DomainState } = this;

    return <DomainState key={forDomain} {...props} />;
  }
}

States.propTypes = {
  for: PropTypes.string.isRequired
};

States.contextTypes = {
  machine: PropTypes.object,
  scope: PropTypes.array
};

export default States;
