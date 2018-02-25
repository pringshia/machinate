import { Component } from "react";
import PropTypes from "prop-types";

class DomainState extends Component {
  constructor(props) {
    super(props);
    this.props._config.onAdd(this);
    this.transition = this.props._config.machine.transition;
  }
  componentWillUnmount() {
    // console.log(
    //   "Actual state unmounting",
    //   this.context.scope.join("/"),
    //   this.props._config.domainName
    // );
    this.props._config.onRemove(this);
  }
  render() {
    const {
      domainName,
      machine: { getState, transition, go }
    } = this.props._config;
    const { scope } = this.context;
    const stateInfo = getState([...scope, domainName].join("/"));
    if (!stateInfo) return null;

    const stateName = stateInfo.state;

    if (!this.props[stateName])
      throw new Error(`State '${stateName}' not defined in '${domainName}'`);
    return this.props[stateName](stateInfo.data, {
      transition: transition,
      go: go
    });
  }
}

DomainState.contextTypes = {
  scope: PropTypes.array
};

export default DomainState;
