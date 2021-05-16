import "../../lib/formiojs/4.13.1/formio.full.min.js";

const version = "0.0.1";

const formOptions = {
    display: "wizard"
};

const builderOptions =
{
    builder: {
        basic: {
            components: {
                password: false
            }
        },
        advanced: false,
        data: false,
        premium: false
    }
};

document.addEventListener("DOMContentLoaded", () => {

    const styleId = "font-face-FontAwesome";
    if (!document.head.querySelector(`#${styleId}`)) {
        const style = document.createElement("STYLE");
        style.innerHTML = `
        @font-face {
            font-family: 'FontAwesome';
            src: url('/lib/formiojs/4.13.1/fonts/fontawesome-webfont.eot?v=4.7.0');
            src: url('/lib/formiojs/4.13.1/fonts/fontawesome-webfont.eot?#iefix&v=4.7.0') format('embedded-opentype'), url('/lib/formiojs/4.13.1/fonts/fontawesome-webfont.woff2?v=4.7.0') format('woff2'), url('/lib/formiojs/4.13.1/fonts/fontawesome-webfont.woff?v=4.7.0') format('woff'), url('/lib/formiojs/4.13.1/fonts/fontawesome-webfont.ttf?v=4.7.0') format('truetype'), url('/lib/formiojs/4.13.1/fonts/fontawesome-webfont.svg?v=4.7.0#fontawesomeregular') format('svg');
            font-weight: normal;
            font-style: normal;
        }`;
        style.id = styleId;
        document.head.appendChild(style);
    }

});

class FormBuilder extends HTMLElement {

    constructor() {
        super();
    }


    async connectedCallback() {

        this.attachShadow({ mode: "open" });
        const script = document.createElement("SCRIPT");
        script.src = "/lib/formiojs/4.13.1/formio.full.min.js";

        const style = document.createElement("STYLE");
        style.innerHTML = `
            @import "/lib/bootstrap/4.6.0/css/bootstrap.min.css";
            @import "/lib/formiojs/4.13.1/formio.full.min.css";
            body > header { display: none; }
        `;

        const editorDiv = document.createElement("DIV");

        //this.shadowRoot.appendChild(script);
        this.appendChild(style);
        this.appendChild(editorDiv);

        const builder = await Formio.builder(editorDiv, formOptions, builderOptions);

    }

}

customElements.define("form-builder", FormBuilder);