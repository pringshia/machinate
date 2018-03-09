import React from "react";
import { createMachine, isTransitionable } from "../src/machine";
import { mount, shallow } from "enzyme";
import { Submachine, States } from "../src";

describe("submachines", () => {
  let machine;

  const scheme = {
    Auth: { states: ["LoggedOut", "LoggedIn"] },
    Display: { states: ["Visible", "Hidden"] }
  };

  beforeEach(() => {
    const initialState = { Auth: { state: "LoggedOut" } };
    machine = createMachine(scheme, initialState);
  });

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
      "Level1/Display": { state: "Visible" }
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
      "Level1/Display": { state: "Visible" },
      "Level1/Level2/Display": { state: "Hidden" }
    });

    wrapper2.unmount();

    expect(machine.getState()).toEqual({
      Auth: { state: "LoggedOut" },
      "Level1/Display": { state: "Visible" }
    });

    wrapper1.unmount();
    expect(machine.getState()).toEqual({
      Auth: { state: "LoggedOut" }
    });
  });
  xtest("should change within that domain when transitioning", () => {
    const initialState = { Auth: "LoggedOut", Display: "Visible" };
    machine = createMachine(scheme, initialState);

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
      Display: { state: "Visible" },
      "Level1/Display": { state: "Visible" }
    });

    const DomainState = machine.componentForDomain(["Level1"], "Display");
    const wrapper2 = shallow(
      <DomainState
        Visible={(_, { transition }) => {
          transition("Display.Hidden");
        }}
        Hidden={() => null}
      />
    );

    // TODO: Replace with a better enzyme test where context is tested
    wrapper2.getElement().props._config.machine.transition("Display", "Hidden");

    expect(machine.getState()).toEqual({
      Auth: { state: "LoggedOut" },
      Display: { state: "Visible" },
      "Level1/Display": { state: "Hidden" }
    });
  });
  test("should support dependencies", () => {
    const scheme = {
      Auth: { states: ["LoggedIn", "LoggedOut", "Unknown", "Error"] },
      Display: {
        states: ["Dashboard", "Settings", "CreateItem"],
        deps: { "Auth.LoggedIn": "Dashboard" }
      },
      ItemWizard: {
        states: ["Step1", "Step2", "Step3"],
        deps: { "Display.CreateItem": "Step1" }
      }
    };

    const initialState = { Auth: "LoggedOut" };
    const machine = createMachine(scheme, initialState);

    machine.registerSubmachine(["App1"], initialState);

    expect(machine.getState()).toEqual({
      Auth: { state: "LoggedOut" },
      "App1/Auth": { state: "LoggedOut" }
    });

    machine.transition(["App1"], "Auth.LoggedIn", "bobsmith");

    expect(machine.getState()).toEqual({
      Auth: { state: "LoggedOut" },
      "App1/Auth": { state: "LoggedIn", data: "bobsmith" },
      "App1/Display": { state: "Dashboard" }
    });

    machine.transition(["App1"], "Auth.LoggedOut");
    expect(machine.getState()).toEqual({
      Auth: { state: "LoggedOut" },
      "App1/Auth": { state: "LoggedOut" }
    });

    machine.removeSubmachine(["App1"]);
    expect(machine.getState()).toEqual({
      Auth: { state: "LoggedOut" }
    });
  });
  test("should be able to specify parent states with same name", () => {
    const scheme = {
      Visible: ["Yes", "No"]
    };
    const initialState = { Visible: "Yes" };

    const machine = createMachine(scheme, initialState);
    machine.registerSubmachine(["Item-1"], initialState);
    machine.registerSubmachine(["Item-1", "Item-2"], initialState);
    machine.registerSubmachine(["Item-1", "Item-2", "Item-3"], initialState);
    machine.registerSubmachine(
      ["Item-1", "Item-2", "Item-3", "Item-4"],
      initialState
    );

    expect(machine.getState()).toEqual({
      Visible: { state: "Yes" },
      "Item-1/Visible": { state: "Yes" },
      "Item-1/Item-2/Visible": { state: "Yes" },
      "Item-1/Item-2/Item-3/Visible": { state: "Yes" },
      "Item-1/Item-2/Item-3/Item-4/Visible": { state: "Yes" }
    });

    machine.transition(["Item-1", "Item-2", "Item-3", "Item-4"], "Visible.No");

    expect(machine.getState()).toEqual({
      Visible: { state: "Yes" },
      "Item-1/Visible": { state: "Yes" },
      "Item-1/Item-2/Visible": { state: "Yes" },
      "Item-1/Item-2/Item-3/Visible": { state: "Yes" },
      "Item-1/Item-2/Item-3/Item-4/Visible": { state: "No" }
    });

    machine.transition(
      ["Item-1", "Item-2", "Item-3", "Item-4"],
      "Item-3/Visible.No"
    );

    expect(machine.getState()).toEqual({
      Visible: { state: "Yes" },
      "Item-1/Visible": { state: "Yes" },
      "Item-1/Item-2/Visible": { state: "Yes" },
      "Item-1/Item-2/Item-3/Visible": { state: "No" },
      "Item-1/Item-2/Item-3/Item-4/Visible": { state: "No" }
    });

    machine.transition(
      ["Item-1", "Item-2", "Item-3", "Item-4"],
      "Item-2/Visible.No"
    );

    expect(machine.getState()).toEqual({
      Visible: { state: "Yes" },
      "Item-1/Visible": { state: "Yes" },
      "Item-1/Item-2/Visible": { state: "No" },
      "Item-1/Item-2/Item-3/Visible": { state: "No" },
      "Item-1/Item-2/Item-3/Item-4/Visible": { state: "No" }
    });

    machine.transition(
      ["Item-1", "Item-2", "Item-3", "Item-4"],
      "Item-1/Visible.No"
    );

    expect(machine.getState()).toEqual({
      Visible: { state: "Yes" },
      "Item-1/Visible": { state: "No" },
      "Item-1/Item-2/Visible": { state: "No" },
      "Item-1/Item-2/Item-3/Visible": { state: "No" },
      "Item-1/Item-2/Item-3/Item-4/Visible": { state: "No" }
    });

    machine.transition(["Item-1", "Item-2", "Item-3", "Item-4"], "/Visible.No");

    expect(machine.getState()).toEqual({
      Visible: { state: "No" },
      "Item-1/Visible": { state: "No" },
      "Item-1/Item-2/Visible": { state: "No" },
      "Item-1/Item-2/Item-3/Visible": { state: "No" },
      "Item-1/Item-2/Item-3/Item-4/Visible": { state: "No" }
    });

    machine.transition(["Item-1", "Item-2", "Item-3"], "Visible.Yes");

    expect(machine.getState()).toEqual({
      Visible: { state: "No" },
      "Item-1/Visible": { state: "No" },
      "Item-1/Item-2/Visible": { state: "No" },
      "Item-1/Item-2/Item-3/Visible": { state: "Yes" },
      "Item-1/Item-2/Item-3/Item-4/Visible": { state: "No" }
    });
    machine.transition([], "/Visible.Yes");

    expect(machine.getState()).toEqual({
      Visible: { state: "Yes" },
      "Item-1/Visible": { state: "No" },
      "Item-1/Item-2/Visible": { state: "No" },
      "Item-1/Item-2/Item-3/Visible": { state: "Yes" },
      "Item-1/Item-2/Item-3/Item-4/Visible": { state: "No" }
    });
  });
});
