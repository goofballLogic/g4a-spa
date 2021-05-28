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

    for (const invoker of content.querySelectorAll("[data-invoke]")) {

        const func = invoker.dataset.invoke;
        invokable[func](invoker, item, params);

    }

}

const invokable = {

    buildWorkflowStatusForm(element, item) {

        const { workflow, status } = item;
        if (!workflow) return "An error occurred (R1_BWFSF)";
        const states = workflow.workflow;
        const currentState = status
            ? states.find(x => x.id === status)
            : states.find(x => x.default);
        if (!currentState) return "An error occurred (R2_BWFSF)";

        const transitions = Array.isArray(currentState.transitions)
            ? currentState.transitions
            : currentState.transitions
                ? [currentState.transitions]
                : [];
        const targetStates = transitions.map(x => ({ ...x, ...states.find(y => y.id === x.id) }));

        element.innerHTML = `
            <div>Current status: <span class="grant-status ${currentState.id}">${currentState.status}</div>
            <h3>Change the state</h3>
            ${targetStates.map(transition => `

                <label>

                    <input type="radio" name="status" value="${transition.id}">
                    <span class="text">${transition.status}</span>
                    <aside>${transition.description}</aside>

                </label>


            `).join("<br />")}
        `;

    },

    createApplicationOutput(element, item) {

        if (item?.myChildren?.length) element.classList.add("applications-exist");

    },

    createApplicationMyChildren(element, item, params) {

        const myChildren = item?.myChildren || [];
        if (myChildren.length !== 1) {

            element.innerHTML = `<ol>${myChildren
                .map(x => applicationLink(x, params))
                .map(x => `<li>${x}</li>`)
                .join()}</ol>`;

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
            .map(x => item[x]?.toString())
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

    item = { ...commonParams, ...params, ...item };
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

export function emplaceIfs(content, item) {

    for (const ifer of content.querySelectorAll("[data-if-key]")) {

        const { ifKey, ifValue, ifClass } = ifer.dataset;
        const itemValue = access(item, ifKey);
        const result = (itemValue && itemValue.value.toString() === ifValue)
            ? ifClass || "true"
            : ifClass ? "" : "false";
        ifer.classList.add(result);

    }

}

export function emplaceSetAttrs(content, item) {

    for (const setAttrer of content.querySelectorAll("[data-set-attr-key]")) {

        const { setAttrKey, setAttrValue } = setAttrer.dataset;
        const itemValue = access(item, setAttrValue);
        let value = itemValue ? itemValue.value : null;
        if (value && typeof (itemValue) !== "string") value = JSON.stringify(value);
        setAttrer.setAttribute(setAttrKey, value);

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

    const bits = (path || "").split(".");
    while (data && bits.length > 0) {

        const bit = bits.shift();
        data = data[bit];

    }
    return (data === undefined || data === null) ? null : { value: data };

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