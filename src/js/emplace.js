import urlTemplates from "../lib/url-template.js";
const commonParams = Object.fromEntries(new URL(location.href).searchParams.entries());

export function emplaceFormInputs(content, item) {

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


const dtformat = new Intl.DateTimeFormat([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
});

export function emplaceInvokations(content, item, params) {

    for (let invoker of content.querySelectorAll("[data-invoke]")) {

        const func = invoker.dataset.invoke;
        invokable[func](invoker, item, params);

    }

}

const invokable = {

    createApplicationOutput(element, item) {

        if (item?.myChildren?.length) element.classList.add("applications-exist");

    },

    createApplicationMyChildren(element, item, params) {

        const myChildren = item?.myChildren || [];
        if (myChildren.length !== 1) {

            element.innerHTML = `<ol>${myChildren
                .map(x => applicationLink(x, params))
                .map(x => `<li>${x}</li>`)}</ol>`;

        } else {

            element.innerHTML = applicationLink(myChildren[0], params);

        }

    }

};

function applicationLink({ id, status }, params) {

    let linkParams = `_=/view-application/${id}`;
    if (params.portal_tid) linkParams += `&ptid=${params.portal_tid}`;
    return `<a href="?${linkParams}">Your ${status} application</a>`;

}

export function emplaceCSSClasses(content, item) {

    for (let csser of content.querySelectorAll("[data-add-class]")) {

        (csser.dataset.addClass ? csser.dataset.addClass.split(",") : [])
            .map(x => x.trim())
            .filter(x => x)
            .map(x => item[x])
            .filter(x => x)
            .forEach(x => csser.classList.add(x));

    }

}

export function emplaceDateContent(content, item) {

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

export function emplaceHrefs(content, item, params) {

    console.log(params);
    item = { ...commonParams, ...params, ...item };
    console.log(item);
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

export function emplaceTextContent(content, item) {

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