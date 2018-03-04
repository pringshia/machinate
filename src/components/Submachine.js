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

    this.register(context.machine, props, context);
  }
  register(machine, props, context) {
    !context.forced &&
      machine.registerSubmachine(this.getChildContext().scope, props.initial);
  }
  componentDidMount() {
    // TODO: Test out this behavior of re-registering submachines in cDM.
    // Currently we need to re-add registerSubmachine here.
    // Not doing so breaks demo/03-submachines in that on re-render
    // of a list of submachines, new submachines are added first,
    // then the old ones are unmounted deleting the new ones that were added.
    // Instead we'd like the old ones to be removed FIRST. And the new ones to
    // be added. Also, only leaving this in componentDidMount and not the constructor
    // causes extremely erratic behavior, where dependent children may depend on
    // the parent submachine's state.
    //
    // this.register(this.context.machine);
  }
  componentWillReceiveProps(nextProps, nextContext) {
    // TODO: implement a better deep compare
    const deepdiff = (a, b) => JSON.stringify(a) !== JSON.stringify(b);
    if (deepdiff(this.props.initial, nextProps.initial)) {
      // console.log("re-registering ", nextProps.id, "with", nextProps.initial);
      this.register(this.context.machine, nextProps, nextContext);
    }
  }
  componentWillUnmount() {
    this.context.machine.removeSubmachine(this.getChildContext().scope);
  }
  render() {
    return this.props.children;
  }
}

Submachine.contextTypes = {
  scope: PropTypes.array,
  machine: PropTypes.object,
  forced: PropTypes.bool
};

Submachine.childContextTypes = {
  scope: PropTypes.array
};

Submachine.propTypes = {
  id: PropTypes.string.isRequired,
  initial: PropTypes.object.isRequired
};

export default Submachine;
