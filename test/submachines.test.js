import React from "react";
import { createMachine, isTransitionable } from "../src/machine";
import { shallow, mount, render } from "enzyme";
import { Submachine } from "../src";

describe("submachines", () => {
  test("when nested should retain parent ids via context", () => {
    const wrapper = shallow(<Submachine id="Level1" />, {
      context: { scope: [] }
    });
    expect(wrapper.instance().getChildContext()).toEqual({ scope: ["Level1"] });

    const wrapper2 = shallow(<Submachine id="Level2" />, {
      context: { scope: ["Level1"] }
    });
    expect(wrapper2.instance().getChildContext()).toEqual({
      scope: ["Level1", "Level2"]
    });
  });
});
