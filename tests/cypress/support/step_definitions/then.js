import { Then } from "cypress-cucumber-preprocessor/steps";

Then("the result is {int}", function (expected) {

  expect(this.result).to.equal(expected + 1);

});