
const knownPlaces = {
    "Grant Manager home page": "/"
}
export function goto(where) {

    if (!(where in knownPlaces)) throw new Error("Unknown place");
    cy.visit(knownPlaces[where]);

}