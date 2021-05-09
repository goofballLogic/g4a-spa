import "../lib/azure-storage-blob.min.js";
import { handleFormMutations, handleFormSubmission } from "./forms.js";
import { handleQueries } from "./queries.js";

function placeholder(className) {
    const div = document.createElement("DIV");
    div.textContent = `Content for this path isn't availble. Check back soon for more options (RRP1_${className}).`;
    return div;
}

function injectNav(content) {
    const nav = document.querySelector("template#default_nav").content.cloneNode(true);
    const placeHolder = content.querySelector("nav");
    if (placeHolder)
        placeHolder.parentNode.replaceChild(nav, placeHolder);
}

export function render(container) {
    const url = new URL(location.href);
    const path = url.searchParams.get("_") || "/";
    let className = (path && path !== "/") ? path : "home";
    if (container.className == className) return;
    className = className.replace(/^\//, "").replace(/\//g, "__");

    const template = document.querySelector(`template#${className}`);
    const content = template ? template.content.cloneNode(true) : placeholder(className);

    if (className !== "home") injectNav(content);
    handleFormSubmission(content);
    handleQueries(content);
    handleFormMutations(content);

    container.innerHTML = "";
    container.appendChild(content);
    container.className = className;
}