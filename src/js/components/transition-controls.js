class TransitionControls extends HTMLElement {

    #transitions = [];
    #outputControl = null;

    constructor() {

        super();
        this.ensureStyleSheet();
        this.parseAttributes();
        this.render();
        this.attachEventHandlers();

    }

    attachEventHandlers() {

        this.addEventListener("click", e => {

            console.log(this.#outputControl);
            if (!e.target.dataset.status) return;
            if (this.#outputControl) this.#outputControl.value = e.target.dataset.status;

        });

    }

    attributeChangedCallback() {

        this.parseAttributes();
        this.render();

    }

    ensureStyleSheet() {

        if (document.head.querySelector("link#transition-controls-styles")) return;
        const link = document.createElement("LINK");
        const { url } = import.meta;
        link.setAttribute("href", url.replace(/js$/, "css"));
        link.setAttribute("rel", "stylesheet");
        link.id = "transition-controls-styles";
        document.head.appendChild(link);

    }

    parseAttributes() {

        this.#transitions = [];
        this.#outputControl = null;
        try {

            const outputSelector = this.getAttribute("outputSelector");
            const outputParentSelector = this.getAttribute("outputParentSelector");
            this.#outputControl = outputSelector
                ? document.querySelector(outputSelector)
                : outputParentSelector
                    ? this.parentElement.querySelector(outputParentSelector)
                    : null;

            const raw = this.getAttribute("transitions");
            this.#transitions = JSON.parse(raw);
            if (!Array.isArray(this.#transitions)) {

                this.#transitions = [];
                throw new Error(`Invalid transitions: ${JSON.stringify(raw)}`);

            }

        } catch (err) {

            setTimeout(() => { throw err; });

        }

    }

    render() {

        this.innerHTML = this.#transitions
            .map(x => this.renderTransition(x))
            .join("\n");

    }

    renderTransition(t) {

        console.log(t.failedConstraints);
        return `
            <div class="${t.id}">

                ${t.failedConstraints
                ? `<div class="constrained">You can't ${t.action} just now. If this grant has a submission deadline, it may have expired.
                    </div>`
                : `
                    <button class="${t.id}" data-status="${t.id}">${t.action}</button>
                    <div>${t.description || ""}</div>
                `}

            </div>
        `;

    }

}

customElements.define("transition-controls", TransitionControls);