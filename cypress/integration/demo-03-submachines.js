const APP_URL = "http://localhost:3001";

describe("Demo 3", () => {
  it("is loaded with React properly", () => {
    cy.visit(APP_URL);
    cy.get("[data-test='list-header']").should("have.text", "My List");
  });
  it("should toggle visibility", () => {
    cy.visit(APP_URL);
    cy.get(".list-container").should("contain", "Block");
    cy.get("[data-test='toggle-visibility']").click();
    cy.get(".list-container").should("not.contain", "Block");
  });
  it("should add a block", () => {
    cy.visit(APP_URL);
    cy.get("[data-test='add-block']").click();
    cy.get(".list-container").should("contain", "3");
  });
  it("should be able to edit a newly added block", () => {
    cy.visit(APP_URL);
    cy.get("[data-test='add-block']").click();
    cy.get(".list-container").should("contain", "3");

    cy.get("[data-test='change-mode-2']").click();
    cy
      .get("[data-test='input-2']")
      .clear()
      .type("Hello");
    cy.get("[data-test='save-2']").click();

    cy.get("[data-test='text-2']").should("contain", "Hello");

    cy.window().then(win => {
      const snapshot = win.machine.getState();
      cy.visit(APP_URL);

      cy.window().then(win => {
        win.machine.setState(snapshot);
        cy.get("[data-test='text-2']").should("contain", "Hello");
      });
    });
  });
});
