import { Given } from "cypress-cucumber-preprocessor/steps";
import { goto } from "./steps/navigation";

Given("I go to the {}", goto);