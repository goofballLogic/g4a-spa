import { decorateHeaders } from "./auth-api.js";
import { sleeperServiceURL } from "./service-config.js";
import urlTemplates from "../lib/url-template.js";

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

        emplaceTextContent(dataItem, item);
        emplaceCSSClasses(dataItem, item);
        emplaceDateContent(dataItem, item);
        emplaceHrefs(dataItem, item);
        emplaceFormInputs(dataItem, item);
        emplaceInvokations(dataItem, item);

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

function emplaceFormInputs(content, item) {

    for (let input of content.querySelectorAll("input")) {

        if ((input.type === "text" || input.type === "hidden")) {

            const { value: valueKey } = input.dataset;
            if (valueKey) {

                if (valueKey in item) input.value = item[valueKey];

            } else if (input.name in item) {

                if (input.dataset.overwriteValue !== "true")
                    input.value = item[input.name];

            }

        }
        if (input.type === "radio" && input.name in item) {

            const isChecked = item[input.name] === input.value;
            input.checked = isChecked;
            if (isChecked)
                input.dispatchEvent(new Event("change"));

        }

    }

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
            for (let item of items) {

                const content = template.content.cloneNode(true);
                emplaceTextContent(content, item);
                emplaceHrefs(content, item);
                emplaceCSSClasses(content, item);
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

const dtformat = new Intl.DateTimeFormat([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
});

function emplaceInvokations(content, item) {

    for (let invoker of content.querySelectorAll("[data-invoke]")) {

        const func = invoker.dataset.invoke;
        invokable[func](invoker, item);

    }

}

const invokable = {

    createApplicationOutput(element, item) {

        if (item?.myChildren?.length) element.classList.add("applications-exist");

    },

    createApplicationMyChildren(element, item) {

        const myChildren = item?.myChildren || [];
        if (myChildren.length !== 1) {

            element.innerHTML = `<ol>${myChildren
                .map(applicationLink)
                .map(x => `<li>${x}</li>`)}</ol>`;

        } else {

            element.innerHTML = applicationLink(myChildren[0]);

        }

    }

};

function applicationLink({ id, status }) {
    return `<a href="?_=/view-application/${id}">Your ${status} application</a>`;
}

function emplaceCSSClasses(content, item) {

    for (let csser of content.querySelectorAll("[data-add-class]")) {

        csser.classList.add(item[csser.dataset.addClass]);

    }

}

function emplaceDateContent(content, item) {

    for (let dater of content.querySelectorAll("[data-text-date]")) {

        const dateField = dater.dataset.textDate;
        const dateValue = item[dateField];
        if (!dateValue) continue;
        try {

            const parsed = new Date(dateValue);
            dater.textContent = dtformat.format(parsed);

        } catch (err) {
            console.warn(err);
        }

    }

}

function emplaceHrefs(content, item) {

    for (let hrefer of content.querySelectorAll("[data-href]")) {

        const hrefTemplate = hrefer.dataset.href;
        const expanded = urlTemplates.parse(hrefTemplate).expand(item);
        hrefer.setAttribute("href", expanded);

    }
    for (let submitNext of content.querySelectorAll("[data-submit-next]")) {

        const hrefTemplate = submitNext.dataset.submitNext;
        const expanded = urlTemplates.parse(hrefTemplate).expand(item);
        submitNext.dataset.submitNext = expanded.toString();

    }

}

function emplaceTextContent(content, item) {

    for (let textContenter of content.querySelectorAll("[data-text-content]")) {

        const textContentKey = textContenter.dataset.textContent;

        const itemValue = access(item, textContentKey);
        if (itemValue) {

            textContenter.textContent = itemValue.value;

        } else {

            const defaultItemValue = accessDefaults(textContenter, textContentKey);
            if (defaultItemValue) {

                textContenter.textContent = defaultItemValue.value;

            }

        }

    }

}

function access(data, path) {

    const bits = path.split(".");
    while (data && bits.length > 0) {

        const bit = bits.shift();
        if (bit in data) data = data[bit];

    }
    return data ? { value: data } : null;

}

function accessDefaults(textContenter, textContentKey) {

    const { defaults } = textContenter.dataset;
    if (defaults) {

        try {

            const defaultItemValues = JSON.parse(defaults);
            return access(defaultItemValues, textContentKey);

        } catch (err) {

            console.warn(err);

        }

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