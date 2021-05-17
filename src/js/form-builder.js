import "../lib/formiojs/4.13.1/formio.full.min.js";
import { decorateHeaders } from "./auth-api.js";
import { buildSleeperServiceURL } from "./queries.js";

const version = "0.0.1";

const formOptions = {
    display: "wizard",
    components: []
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

document.addEventListener("DOMContentLoaded", async () => {


    const docId = new URL(location.href).searchParams.get("id");
    if (!docId) history.back();

    const docURL = await buildSleeperServiceURL(`documents/{tenant}/${docId}?include=content`);

    const headers = new Headers({ "content-type": "application/json" });
    await decorateHeaders(headers);

    try {

        const resp = await fetch(docURL, { headers });
        const json = await resp.json();
        const schema = json.item?.content?.schema;
        if (schema) {
            if (schema.version && json.item?.version !== version)
                throw new Error("Not implemented");
            Object.assign(formOptions, schema);
        }

    } catch (err) {

        alert(err.stack);
        history.back();

    }

    const editor = document.querySelector("#editor");
    const previewer = document.querySelector("#preview");

    if (editor) await initEditor(editor, docId, headers);
    if (previewer) await initPreview(previewer, docId, headers);

    document.body.classList.add("loaded");

});

async function initPreview(editor, docId, headers) {

    console.log(formOptions);
    await Formio.createForm(editor, formOptions);
    document.querySelector("#controller button").addEventListener("click", async () => {

        history.back();

    });

}

async function initEditor(editor, docId, headers) {

    const builder = await Formio.builder(
        editor,
        formOptions,
        builderOptions
    );

    builder.on("saveComponent", () => {

        localStorage.setItem("working-form-build", JSON.stringify(builder.schema));

    });

    document.querySelector("#controller button").addEventListener("click", async () => {

        const data = JSON.stringify({
            version,
            schema: builder.schema
        });
        const contentURL = await buildSleeperServiceURL(`documents/{tenant}/${docId}/content`);

        const resp = await fetch(contentURL, {
            headers,
            method: "PUT",
            body: JSON.stringify(data)
        });
        if (resp.ok) {

            localStorage.removeItem("working-form-build");
            history.back();

        }

    });
}
