import { Component } from "react";

class Transition extends Component {
  componentWillMount() {
    this.props.transition(this.props.to, this.props.data);
  }
  render() {
    return this.props.children || null;
  }
}

export default Transition;
