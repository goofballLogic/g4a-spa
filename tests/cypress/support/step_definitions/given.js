import { Given } from "cypress-cucumber-preprocessor/steps";

Given("{word} = {int} and {word} = {int}", function (name1, value1, name2, value2) {
    this.variables = this.variable || {};
    this.variables[name1] = value1;
    this.variables[name2] = value2;
});