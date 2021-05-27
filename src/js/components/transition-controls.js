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

            if (e.target.tagName !== "BUTTON") return;
            if (!e.target.classList.contains("value-emitter")) return;
            console.log(e.target);

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

            this.#outputControl = document.querySelector(this.getAttribute("outputSelector"));

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

        return `
            <div class="${t.id}">
                <div>${t.description || "Change"}:</div>
                <button class="value-emitter ${t.id}">${t.action}</button>
            </div>
        `;

    }

}

customElements.define("transition-controls", TransitionControls);