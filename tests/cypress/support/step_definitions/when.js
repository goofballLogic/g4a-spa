import { When } from "cypress-cucumber-preprocessor/steps";

When("I add {word} and {word}", function (name1, name2) {

    const value1 = this.variables && this.variables[name1];
    const value2 = this.variables && this.variables[name2];
    this.result = value1 + value2;

});