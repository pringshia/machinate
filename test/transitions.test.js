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
