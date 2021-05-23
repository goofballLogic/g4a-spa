import { decorateHeaders } from "./auth-api.js";
import { sleeperServiceURL } from "./service-config.js";
import urlTemplates from "../lib/url-template.js";
import {
    emplaceCSSClasses, emplaceDateContent, emplaceFormInputs,
    emplaceHrefs, emplaceInvokations, emplaceTextContent
} from "./emplace.js";

export async function handleQueries(content, params) {

    const dataItems = Array.from(content.querySelectorAll(".data-item[data-item-query]"));
    const dataLists = Array.from(content.querySelectorAll(".data-list"));

    for (let dataItem of dataItems)
        await handleDataItemQuery(dataItem, params);

    for (let dataList of dataLists)
        await handleDataListQuery(dataList, params);

}

async function handleDataItemQuery(dataItem, params) {

    const { itemQuery } = dataItem.dataset;
    const itemQueryTemplate = urlTemplates.parse(itemQuery);
    const itemQueryUrl = itemQueryTemplate.expand(params);

    try {

        const item = await querySleeperService(itemQueryUrl);

        emplaceItem(dataItem, item, params);

    } catch (err) {

        dataItem.classList.add("error");
        const errorContainers = dataItem.querySelectorAll("[data-error-text-content]");
        for (let container of errorContainers) {

            container.textContent = err.toString();

        }

    } finally {

        dataItem.classList.add("loaded");

    }

}

function emplaceItem(dataItem, item, params) {

    emplaceTextContent(dataItem, item);
    emplaceCSSClasses(dataItem, item);
    emplaceDateContent(dataItem, item);
    emplaceHrefs(dataItem, item, params);
    emplaceFormInputs(dataItem, item);
    emplaceInvokations(dataItem, item, params);

}

async function handleDataListQuery(dataList, params) {

    const { query } = dataList.dataset;
    if (!query) return;
    const queryTemplate = urlTemplates.parse(query);
    const queryUrl = queryTemplate.expand(params);

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
    try {

        const items = await querySleeperService(queryUrl);
        if (!(items && items.length)) {

            dataList.classList.add("empty");

        } else {

            const linked = items.findIndex(i => i?.id === location.hash.substring(1));
            if (linked > -1) {
                const linkedItem = items[linked];
                console.log(linkedItem);
                items.splice(linked, 1);
                items.unshift(linkedItem);
            }

            for (let item of items) {

                const content = template.content.cloneNode(true);
                emplaceItem(content, item, params);
                output.appendChild(content);

            }

        }

    } catch (err) {

        dataList.classList.add("error");
        const errorContainers = dataList.querySelectorAll("[data-error-text-content]");
        for (let container of errorContainers) {

            container.textContent = err.toString();

        }

    } finally {

        dataList.classList.add("loaded");

    }

}

async function querySleeperService(query) {

    const headers = new Headers();
    await decorateHeaders(headers);
    const url = await buildSleeperServiceURL(query);
    const resp = await fetch(url, { headers });
    if (!resp.ok) {

        const err = new Error(`${resp.status} ${resp.statusText}`);
        err.resp = resp;
        throw err;

    }
    const { item, items } = await resp.json();
    return item || items;

}

export async function buildSleeperServiceURL(href) {

    if (href.includes("{tenant}"))
        href = href.replace("{tenant}", sessionStorage.getItem("g4a:tenant"));
    const queryURL = new URL(href, location.href);
    const url = sleeperServiceURL(queryURL.pathname);
    url.search = queryURL.search;
    return url;

}