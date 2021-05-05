import { decorateHeaders } from "./auth-api.js";
import { sleeperServiceURL } from "./storage-config.js";
import urlTemplates from "../lib/url-template.js";

export function handleQueries(content) {
    for (let dataList of content.querySelectorAll(".data-list"))
        handleDataListQuery(dataList);
}

async function handleDataListQuery(dataList) {
    const { query } = dataList.dataset;
    if (!query) return;
    const template = dataList.querySelector("template");
    if (!(template && template.content)) {
        console.warn("Missing template in", dataList);
        return;
    }
    const output = dataList.querySelector(".output");
    if (!output) {
        console.warn("Missing output container in", dataList);
        return;
    }
    const items = await querySleeperService(query);
    for (let item of items) {
        const content = template.content.cloneNode(true);
        emplaceTextContent(content, item);
        emplaceHrefs(content, item);
        output.appendChild(content);
    }
    dataList.classList.add("loaded");

}

function emplaceHrefs(content, item) {
    for (let hrefer of content.querySelectorAll("[data-href]")) {
        const hrefTemplate = hrefer.dataset.href;
        const expanded = urlTemplates.parse(hrefTemplate).expand(item);
        hrefer.setAttribute("href", expanded);
    }
}

function emplaceTextContent(content, item) {
    for (let textContenter of content.querySelectorAll("[data-text-content]")) {
        console.log(textContenter);
        const textContentKey = textContenter.dataset.textContent;
        textContenter.textContent = item[textContentKey] || "";
    }
}

async function querySleeperService(query) {
    const headers = new Headers();
    await decorateHeaders(headers);
    const url = new URL(sleeperServiceURL);
    url.searchParams.set("query", query);
    const resp = await fetch(url, { headers });
    if (!resp.ok) {
        const err = new Error(`${resp.status} ${resp.statusText}`);
        err.resp = resp;
        throw err;
    }
    const { items } = await resp.json();
    return items;
}