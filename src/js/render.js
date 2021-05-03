import "../lib/azure-storage-blob.min.js";
import { inboxContainerURL, sleeperServiceURL } from "./storage-config.js";
import { decorateHeaders } from "./auth-api.js";

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

function handleFormSubmission(content) {
    for (let form of content.querySelectorAll("form")) {
        form.addEventListener("submit", e => {
            if (e.target.classList.contains("sleeper-service")) {
                e.preventDefault();
                handleSleeperServiceFormSubmission(e.target);
            }
        });
    }
}

async function handleSleeperServiceFormSubmission(form) {
    const formData = new FormData(form);
    const digest = {};
    for (let [key, val] of formData.entries()) {
        digest[key] = (val instanceof File) ? await upload(val) : val;
    }
    const headers = new Headers();
    await decorateHeaders(headers);
    await fetch(sleeperServiceURL, {
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify(digest)
    });
    console.log("Done");
}

async function upload(file) {
    const identifier = `${Date.now()}_${Math.round(Math.random() * 100000000)}`;
    const blockBlobURL = azblob.BlockBlobURL.fromContainerURL(inboxContainerURL, identifier);
    await azblob.uploadBrowserDataToBlockBlob(azblob.Aborter.none, file, blockBlobURL);
    const { name, size, type, lastModified } = file;
    const metadata = { name, size, type, lastModified, identifier };
    return metadata;
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

    container.innerHTML = "";
    container.appendChild(content);
    container.className = className;
}