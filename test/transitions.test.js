import { createMachine } from "../src/machine";

describe("Transitioning", () => {
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
  describe("with deps", () => {
    test("should know if a state is transitionable", () => {
      const initialState = { Auth: "LoggedOut" };

      const machine = createMachine(scheme, initialState);
      expect(machine.isTransitionable("ItemWizard.Step1")).toBeFalsy();
      machine.transition("Auth", "LoggedIn");
      machine.transition("Display", "CreateItem");
      expect(machine.isTransitionable("ItemWizard.Step1")).toBeTruthy();
      machine.transition("Display", "Dashboard");
      expect(machine.isTransitionable("ItemWizard.Step1")).toBeFalsy();
      machine.transition("Display", "CreateItem");
      expect(machine.isTransitionable("ItemWizard.Step1")).toBeTruthy();
      machine.transition("Auth", "LoggedOut");
      expect(machine.isTransitionable("ItemWizard.Step1")).toBeFalsy();
      machine.transition("Auth", "LoggedIn");
      expect(machine.isTransitionable("ItemWizard.Step1")).toBeFalsy();
    });
    test("should only work if deps are available", () => {
      const initialState = { Auth: "LoggedOut" };

      const machine = createMachine(scheme, initialState);
      machine.transition("ItemWizard", "Step1");

      expect(machine.getState()).not.toHaveProperty("ItemWizard");
    });
    test("should trigger new dependent states", () => {
      const initialState = { Auth: "LoggedIn" };

      const machine = createMachine(scheme, initialState);

      expect(machine.getState()).not.toHaveProperty("Display");
      machine.transition("Auth", "LoggedIn");
      expect(machine.getState()).toHaveProperty("Display");
    });
    test("should destroy old dependent states", () => {
      const initialState = { Auth: "LoggedIn" };

      const machine = createMachine(scheme, initialState);

      expect(machine.getState()).not.toHaveProperty("Display");
      machine.transition("Auth", "LoggedIn");
      expect(machine.getState()).toHaveProperty("Display");
      machine.transition("Auth", "LoggedOut");
      expect(machine.getState()).not.toHaveProperty("Display");
    });
  });
});
