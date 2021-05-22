import "../lib/azure-storage-blob.min.js";
import { emplaceHrefs, emplaceTextContent } from "./emplace.js";
import { handleFormMutations, handleFormSubmission } from "./forms.js";
import { handleQueries } from "./queries.js";

import { account, determineAuthenticationStatus, signIn } from "./auth.js";

function placeholder(className) {
    const div = document.createElement("DIV");
    div.textContent = `Content for this path isn't availble. Check back soon for more options (RRP1_${className}).`;
    return div;
}

function injectNav(content) {

    const navPlaceHolder = content.querySelector("nav");
    console.log(navPlaceHolder);
    if (navPlaceHolder && navPlaceHolder.dataset.overwriteValue !== "true") {
        const nav = document.querySelector("template#default_nav").content.cloneNode(true);
        navPlaceHolder.parentNode.replaceChild(nav, navPlaceHolder);
    }

}

export async function render(container) {

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
        pathParams.unshift(bits.pop());

    }

    const authStatus = await determineAuthenticationStatus();
    if (authStatus.isLoggedIn) {

        document.body.classList.add("logged-in");

    }
    if (template && template.classList.contains("secured")) {

        if (!authStatus.isLoggedIn) {

            signIn();
            return;

        }

    }

    const content = template ? template.content.cloneNode(true) : placeholder(className);
    injectNav(content);

    const query = Object.fromEntries(new URL(location.href).searchParams.entries());
    const params = {};
    if (query.ptid) {

        params.portal_tid = query.ptid;

    }
    if (authStatus.isLoggedIn) {

        const claims = (authStatus.account?.idTokenClaims) || { "username": "unknown" };
        const name = claims["given_name"] && `${claims["given_name"]} ${claims["family_name"]}`;
        const email = claims.emails?.length && claims.emails[0];
        params.account_name = (name && email)
            ? `${name} (${email})`
            : name || email || claims.username;


    }
    params.tid = sessionStorage.getItem("g4a:tenant");
    if (template && template.dataset.params) {

        template.dataset.params.split(",").forEach((name, index) => {

            params[name] = pathParams[index];

        });

    }

    console.log(params);

    const nav = content.querySelector("nav");
    if (nav) handleNav(nav, params);
    handleFormSubmission(content);
    handleQueries(content, params);
    handleFormMutations(content);

    container.innerHTML = "";
    container.appendChild(content);
    container.className = `${className}-area`;

}

function handleNav(nav, params) {

    emplaceHrefs(nav, params);
    emplaceTextContent(nav, params);

}