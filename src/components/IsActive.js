import React from "react";
import withState from "./withState";

const IsActive = ({ state, children }) => {
  const Comp = withState(state, () => children(true), () => children(false));
  return <Comp />;
};

export default IsActive;
