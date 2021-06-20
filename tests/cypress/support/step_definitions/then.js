import { Then } from "cypress-cucumber-preprocessor/steps";
import { mainTitle } from "./steps/text-assertions";

Then("it should show the main title on the page and browser tab", mainTitle);