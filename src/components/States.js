import React from "react";
import PropTypes from "prop-types";

const States = ({ for: forDomain, ...props }, { machine, scope }) => {
  const DomainState = machine.componentForDomain(scope, forDomain);
  return <DomainState {...props} />;
};

States.propTypes = {
  for: PropTypes.string.isRequired
};

States.contextTypes = {
  machine: PropTypes.object,
  scope: PropTypes.array
};

export default States;
