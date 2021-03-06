import "https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js";

class WorkflowEditor extends HTMLElement {

    #workflow;
    #states;

    constructor() {

        super();
        this.ensureStyleSheet();
        this.parseAttributes();
        this.render();

    }

    ensureStyleSheet() {

        if (document.head.querySelector("link#workflow-editor-styles")) return;
        const link = document.createElement("LINK");
        const { url } = import.meta;
        link.setAttribute("href", url.replace(/js$/, "css"));
        link.setAttribute("rel", "stylesheet");
        link.id = "workflow-editor-styles";
        document.head.appendChild(link);

    }

    attributeChangedCallback() {

        this.parseAttributes();
        this.render();
    }

    parseAttributes() {

        this.#workflow = null;
        try {

            this.#workflow = JSON.parse(this.getAttribute("workflow"));
            this.#states = (this.#workflow?.workflow || [])
                .map(s => s ? s : {})
                .map(s => ({
                    ...s,
                    transitions: Array.isArray(s.transitions) ? s.transitions : s.transitions ? [s.transitions] : []
                }));

        } catch (err) {

            setTimeout(() => { throw err; });

        }

    }

    render() {

        if (!Array.isArray(this.#states)) {

            this.innerHTML = "Not defined";

        } else {

            this.innerHTML = `
                <div class="temp"></div>
                <section>
                    ${this.#workflow.values
                    ? `This workflow calculates some values: ${JSON.stringify(this.#workflow.values)}<br /><br />`
                    : ""}
                </section>
                <section class="switcher">
                    <label>
                        <input type="radio" checked name="workflow-editor-mode" value="graph" />
                        <span class="text">Chart</span>
                    </label>
                    <label>
                        <input type="radio" name="workflow-editor-mode" value="text" />
                        <span class="text">Text</span>
                    </label>
                    <label>
                        <input type="radio" name="workflow-editor-mode" value="both" />
                        <span class="text">Both</span>
                    </label>
                </section>
                <section class="main">
                    <div class="text">${this.#states.map(x => this.renderStatus(x)).join("")}</div>
                    <div class="diagram"></div>
                </section>
            `;

            this.querySelector(".switcher").addEventListener("change", () => {
                this.classList.remove("graph-mode");
                this.classList.remove("text-mode");
                this.classList.remove("both-mode");
                this.classList.add(`${this.querySelector(".switcher input:checked").value}-mode`);
            });
            const working = this.querySelector(".temp");
            working.id = `_${Date.now()}_${Math.round(Math.random() * Date.now())}`;

            const wrap = words => words
                .split(" ")
                .reduce((result, w, index) => `${result}${index % 4 === 0 ? "<br>" : " "}${w}`);

            const options = {
                theme: "neutral",
                sequence: {
                    height: 30,
                    messageFontSize: "10pt"
                }
            };
            const text = [
                `%%{init: ${JSON.stringify(options)} }%%`,
                "sequenceDiagram"
            ].concat(
                this.#states
                    .sort((a, b) => a.default ? -1 : b.default ? 1 : 0)
                    .map(s => `participant ${s.id} as ${s.status}`)
            ).concat(
                this.#states
                    .map(s => s.transitions
                        .map(t => `${s.id}->>${t.id}: ${wrap(`${t.action}: ${t.description}`)}`)
                        .join("\n")
                    ).join("\n")
            ).join("\n");

            const diagram = this.querySelector(".diagram");
            diagram.innerHTML = mermaid.mermaidAPI.render(working.id, text);

        }

    }

    renderStatus(status) {

        return `
            <details>
                <summary>${status.status}</summary>
                <label>
                    <input type="checkbox" name="default" value="true" ${status.default ? "checked" : ""} />
                    Default (This is the starting state)
                </label>
                <label>
                    <input type="checkbox" name="readwrite" value="true" ${status.readwrite ? "checked" : ""} />
                    ${this.describeWriteable()}
                </label>
                ${(this.#workflow?.disposition === "grant") ? `
                    <label>
                        <input type="checkbox" name="public" value="true" ${status.public ? "checked" : ""} />
                        Discoverable (this grant appears in the portal)
                    </label>
                    <label>
                        <input type="checkbox" name="cloneable" value="true" ${status.cloneable ? "checked" : ""} />
                        Open (people can create applications for this grant)
                    </label>
                ` : ""}
                <label>
                    Name: <input type="text" name="status" value="${status.status}" />
                </label>
                ${this.renderTransitions(status)}
            </details>
        `;

    }

    describeWriteable() {

        switch (this.#workflow?.disposition) {

            case "grant":
                return "Writeable (the application form still be modified)";
            case "application":
                return "Writeable (the application be modified by the applicant)";
            default:
                return "Writeable (the item still be modified)";
        }

    }

    renderTransitions(status) {

        return `
            <section class="transitions">
                ${status.transitions.length
                ? `
                    <h4>Transitions</h4>
                    <ol>${status.transitions.map(t => this.renderTransition(t)).join("\n")}</ol>
                `
                : ""}
            </section>
        `;

    }

    renderTransition({ id, action, description, clone }) {

        return `
            <li>
                <label>
                    Description:
                    <input type="text" class="description" name="description" value="${description.replace("\"", "\\\"")}" />
                </label>
                <label>
                    Action:
                    <input type="text" name="action" value="${action || ""}" />
                </label>
                <label>
                    transitions to the ${this.renderStatusSelect(id)} state
                </label>
                ${(this.#workflow?.disposition === "application") ? `
                    <label>
                        and adds the application to the <select name="targetOwner">
                            <option>-</option>
                            <option value="same" ${clone && clone["target-owner"] !== "parent" ? "selected" : ""}>applicant's</option>
                            <option value="parent" ${clone && clone["target-owner"] === "parent" ? "selected" : ""}>grant manager's</option>
                        </select>
                    </label>
                    <label>workflow:
                        <input type="text" name="targetWorkflow" placeholder="(none)" value="${clone ? clone["target-workflow"] : ""}" />
                    </label>
                ` : ""}
            </li>
        `;

    }

    renderStatusSelect(selectedId) {

        return `
            <select >
            ${this.#states.map(s => `
                <option value=${s.id} ${s.id === selectedId ? "selected" : ""}>${s.status}</option>
            `).join("")}
            </select>
        `;

    }

}

customElements.define("workflow-editor", WorkflowEditor);