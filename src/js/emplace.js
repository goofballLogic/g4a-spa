import urlTemplates from "../lib/url-template.js";
const commonParams = Object.fromEntries(new URL(location.href).searchParams.entries());

export function emplaceFormInputs(content, item) {

    for (let input of content.querySelectorAll("input")) {

        if (input.type === "text" || input.type === "hidden" || input.type === "date") {

            const { value: valueKey } = input.dataset;
            if (valueKey) {

                const value = access(item, valueKey);
                if (value) input.value = value.value;

            } else {

                if (input.dataset.overwriteValue !== "true") {

                    const value = access(item, input.name);
                    if (value) {

                        input.value = value.value;

                    }

                }

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

export function emplaceInvokations(content, item, params) {

    for (const invoker of content.querySelectorAll("[data-invoke]")) {

        const func = invoker.dataset.invoke;
        try {

            invokable[func](invoker, item, params);

        } catch (err) {

            setTimeout(() => { throw new Error(`${func}: ${err.message}`); });

        }

    }

}

const invokable = {

    setNameToReasonByStatus(element, item) {

        element.setAttribute("name", `${item.status}_reason`);

    },

    onlyIfTransitions(element, item) {

        if (!(item?.transitions?.length))
            element.remove();

    },

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

        if (item?.myChildren?.some(({ status }) => status !== "cancelled"))
            element.classList.add("applications-pending");

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


const dtformat = new Intl.DateTimeFormat([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
});
export function emplaceDateContent(content, item) {

    for (let dater of content.querySelectorAll("[data-text-date]")) {

        const dateField = dater.dataset.textDate;
        const dateValue = access(item, dateField);
        if (!dateValue) continue;
        try {

            const parsed = new Date(dateValue.value);
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
        const hasIfValue = "ifValue" in ifer.dataset;

        const itemValue = access(item, ifKey);
        if (itemValue) {

            const outcome = !hasIfValue || (itemValue.value.toString() === ifValue);
            if (outcome) {

                ifer.classList.add(ifClass || "true");

            } else {

                if (!ifClass)
                    ifer.classList.add("false");

            }

        }

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