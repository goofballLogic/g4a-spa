import { decorateHeaders } from "./auth-api.js";
import { sleeperServiceURL } from "./service-config.js";
import urlTemplates from "../lib/url-template.js";

export function handleQueries(content, params) {

    for (let dataList of content.querySelectorAll(".data-list"))
        handleDataListQuery(dataList);

    for (let dataItem of content.querySelectorAll(".data-item[data-item-query]"))
        handleDataItemQuery(dataItem, params);

}

async function handleDataItemQuery(dataItem, params) {

    const { itemQuery } = dataItem.dataset;
    const itemQueryTemplate = urlTemplates.parse(itemQuery);
    const itemQueryUrl = itemQueryTemplate.expand(params);
    const x = await querySleeperService(itemQueryUrl);
    for (let input of dataItem.querySelectorAll("input")) {

        if (input.type === "text" && input.name in x)
            input.value = x[input.name];
        if (input.type === "radio" && input.name in x) {

            const isChecked = x[input.name] === input.value;
            input.checked = isChecked;
            if (isChecked) input.dispatchEvent(new Event("change"));

        }

    }
    dataItem.classList.add("loaded");
    console.log(x);

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
    if (!(items && items.length)) {

        dataList.classList.add("empty");

    } else {
        for (let item of items) {

            const content = template.content.cloneNode(true);
            emplaceTextContent(content, item);
            emplaceHrefs(content, item);
            output.appendChild(content);

        }

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

        const textContentKey = textContenter.dataset.textContent;
        textContenter.textContent = item[textContentKey] || "";

    }

}

async function querySleeperService(query) {

    const headers = new Headers();
    await decorateHeaders(headers);
    const bits = query.split("/");
    const top = bits.shift();
    const url = sleeperServiceURL(top);
    for (let bit of bits) {

        if (bit === "{tenant}") bit = sessionStorage.getItem("g4a:tenant");
        url.pathname = `${url.pathname}/${bit}`;

    }
    const resp = await fetch(url, { headers });
    if (!resp.ok) {

        const err = new Error(`${resp.status} ${resp.statusText}`);
        err.resp = resp;
        throw err;

    }
    const { item, items } = await resp.json();
    return item || items;

}