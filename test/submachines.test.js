import React from "react";
import { createMachine, isTransitionable } from "../src/machine";
import { shallow } from "enzyme";
import { Submachine } from "../src";

describe("submachines", () => {
  const scheme = {
    Auth: { states: ["LoggedOut", "LoggedIn"] },
    Display: { states: ["Visible", "Hidden"] }
  };
  const initialState = { Auth: { state: "LoggedOut" } };
  const machine = createMachine(scheme, initialState);

  test("when nested should retain parent ids via context", () => {
    const wrapper1 = shallow(
      <Submachine id="Level1" initial={{ Display: "Visible" }} />,
      {
        context: { machine, scope: [] }
      }
    );
    expect(wrapper1.instance().getChildContext()).toEqual({
      scope: ["Level1"]
    });
    expect(machine.getState()).toEqual({
      Auth: { state: "LoggedOut" },
      "Level1/Display": "Visible"
    });

    const wrapper2 = shallow(
      <Submachine id="Level2" initial={{ Display: "Hidden" }} />,
      {
        context: { machine, scope: ["Level1"] }
      }
    );
    expect(wrapper2.instance().getChildContext()).toEqual({
      scope: ["Level1", "Level2"]
    });
    expect(machine.getState()).toEqual({
      Auth: { state: "LoggedOut" },
      "Level1/Display": "Visible",
      "Level1/Level2/Display": "Hidden"
    });

    wrapper2.unmount();

    expect(machine.getState()).toEqual({
      Auth: { state: "LoggedOut" },
      "Level1/Display": "Visible"
    });

    wrapper1.unmount();
    expect(machine.getState()).toEqual({
      Auth: { state: "LoggedOut" }
    });
  });
});
