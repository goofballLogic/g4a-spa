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
    const bits = className.split("/");
    if (!bits[0]) bits.shift();
    let template;
    const pathParams = [];
    while (!template && bits.length) {

        className = bits.join("__");
        template = document.querySelector(`template#${className}`);
        if (template) break;
        pathParams.push(bits.pop());

    }
    const content = template ? template.content.cloneNode(true) : placeholder(className);
    if (className !== "home") injectNav(content);
    const params = {
        tid: sessionStorage.getItem("g4a:tenant")
    };
    if (template && template.dataset.params) {

        template.dataset.params.split(",").forEach((name, index) => {

            params[name] = pathParams[index];

        });

    }
    handleFormSubmission(content);
    handleQueries(content, params);
    handleFormMutations(content);

    container.innerHTML = "";
    container.appendChild(content);
    container.className = className;

}