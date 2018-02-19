import { createMachine } from "../src/machine";

describe("Machine", () => {
  describe("scheme", () => {
    test("should be settable", () => {
      const scheme = {
        Auth: { states: ["LoggedOut", "LoggedIn"] }
      };
      const initialState = { Auth: { state: "LoggedOut" } };
      const machine = createMachine(scheme, initialState);

      const definition = machine.getSlotsDef("Auth");

      console.log(definition);

      expect(definition.states).toHaveLength(2);
      expect(definition.states).toContain("LoggedOut");
      expect(definition.states).toContain("LoggedIn");
      expect(definition.deps).toBeFalsy();
    });

    test("should be settable with scheme shortand syntax", () => {
      const scheme = {
        Auth: ["LoggedOut", "LoggedIn"]
      };
      const initialState = { Auth: { state: "LoggedOut" } };
      const machine = createMachine(scheme, initialState);

      const definition = machine.getSlotsDef("Auth");

      console.log(definition);

      expect(definition.states).toHaveLength(2);
      expect(definition.states).toContain("LoggedOut");
      expect(definition.states).toContain("LoggedIn");
      expect(definition.deps).toBeFalsy();
    });
  });
  describe("initial state", () => {
    test("should be settable", () => {
      const scheme = {
        Auth: { states: ["LoggedOut", "LoggedIn"] }
      };
      const initialState = { Auth: { state: "LoggedOut" } };
      const machine = createMachine(scheme, initialState);

      expect(Object.keys(machine.getState())).toHaveLength(1);
      expect(machine.getState()).toHaveProperty("Auth");
      expect(machine.getState()["Auth"]).toHaveProperty("state");
      expect(machine.getState()["Auth"].state).toEqual("LoggedOut");
    });
    test("should be settable with state shorthand syntax", () => {
      const scheme = {
        Auth: { states: ["LoggedOut", "LoggedIn"] }
      };
      const initialState = { Auth: "LoggedOut" };
      const machine = createMachine(scheme, initialState);

      expect(Object.keys(machine.getState())).toHaveLength(1);
      expect(machine.getState()).toHaveProperty("Auth");
      expect(machine.getState()["Auth"]).toHaveProperty("state");
      expect(machine.getState()["Auth"].state).toEqual("LoggedOut");
    });
  });
});
