import React from "react";
import PropTypes from "prop-types";

const States = ({ for: forDomain, ...props }, { machine }) => {
  const DomainState = machine.componentForDomain(forDomain);
  return <DomainState {...props} />;
};

States.propTypes = {
  for: PropTypes.string.isRequired
};

States.contextTypes = {
  machine: PropTypes.object
};

export default States;
