export function mainTitle() {

    cy.contains("h1", "Grants 4 All").should("exist");
    cy.title().should("include", "Grants 4 All")

}