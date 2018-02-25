import React from "react";
import { createMachine } from "../src/machine";
import { Machinate, States } from "../src";
import { shallow, mount, render } from "enzyme";

describe("Machine init", () => {
  describe("component", () => {
    test("should provide context with machine", () => {
      const scheme = {
        Auth: { states: ["LoggedOut", "LoggedIn"] }
      };
      const initialState = { Auth: { state: "LoggedOut" } };

      const component = shallow(
        <Machinate scheme={scheme} initial={initialState} />
      );

      expect(
        component
          .instance()
          .getChildContext()
          .machine.getState()
      ).toEqual(initialState);
    });
  });
  describe("scheme", () => {
    test("should be settable", () => {
      const scheme = {
        Auth: { states: ["LoggedOut", "LoggedIn"] }
      };
      const initialState = { Auth: { state: "LoggedOut" } };
      const machine = createMachine(scheme, initialState);

      const definition = machine.getDomainInfo("Auth");

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

      const definition = machine.getDomainInfo("Auth");

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
