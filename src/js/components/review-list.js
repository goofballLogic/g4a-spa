const dtformat = new Intl.DateTimeFormat([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
});

class ReviewList extends HTMLElement {

    #reviews = [];

    constructor() {

        super();
        this.ensureStyleSheet();
        this.parseAttributes();
        this.render();
        this.attachEventHandlers();

    }

    attachEventHandlers() {

    }

    attributeChangedCallback() {

        this.parseAttributes();
        this.render();

    }

    ensureStyleSheet() {

        if (document.head.querySelector("link#review-list-styles")) return;
        const link = document.createElement("LINK");
        const { url } = import.meta;
        link.setAttribute("href", url.replace(/js$/, "css"));
        link.setAttribute("rel", "stylesheet");
        link.id = "review-list-styles";
        document.head.appendChild(link);

    }

    parseAttributes() {

        this.#reviews = [];
        try {

            const raw = this.getAttribute("reviews");
            this.#reviews = JSON.parse(raw);
            if (!Array.isArray(this.#reviews)) {

                this.#reviews = [];
                throw new Error(`Invalid reviews: ${JSON.stringify(raw)}`);

            }

        } catch (err) {

            setTimeout(() => { throw err; });

        }

    }

    render() {

        this.innerHTML = this.#reviews.length
            ? this.#reviews
                .map(x => this.renderReview(x))
                .join("\n")
            : "(none)";

    }

    renderReview(review) {

        const div = document.createElement("DIV");
        div.innerHTML = "<div></div>";
        const quill = new Quill(div.children[0], { readOnly: true });
        quill.setContents(review.item);
        return `
            <article>
                <time value="${review.updated}">${dtformat.format(new Date(review.updated))}</time>
                ${div.innerHTML}
            </article>
        `;

    }

}

customElements.define("review-list", ReviewList);