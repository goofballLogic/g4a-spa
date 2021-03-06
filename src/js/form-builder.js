import "../lib/formiojs/4.13.1/formio.full.min.js";
import { decorateHeaders } from "./auth-api.js";
import { buildSleeperServiceURL } from "./queries.js";

const version = "0.0.1";

const formOptions = {
    display: "wizard",
    components: [],
    noDefaultSubmitButton: true
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

let data = null;
let dataString = null;
let schemaString = null;

const url = new URL(location.href);
const docId = url.searchParams.get("id");
if (!docId) history.back();
const tenantSegment = url.searchParams.get("tid") || "{tenant}";

console.log(tenantSegment);

document.addEventListener("DOMContentLoaded", async () => {

    const docURL = await buildSleeperServiceURL(`documents/${tenantSegment}/${docId}?include=content,application`);

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
        data = json.item?.application?.data || { "name": "Andrew" };

    } catch (err) {

        alert(err.stack);
        history.back();

    }

    const editor = document.querySelector("#editor");
    const previewer = document.querySelector("#preview");
    const filler = document.querySelector("#filler");
    const reader = document.querySelector("#reader");

    if (editor) await initEditor(editor, docId, headers);
    if (previewer) await initPreview(previewer, docId, headers);
    if (filler) await initFiller(filler, docId, headers);
    if (reader) await initReader(reader, docId, headers);

    document.body.classList.add("loaded");

});

async function initReader(reader) {

    const form = await Formio.createForm(reader, formOptions, { readOnly: true, renderMode: "html" });
    form.submission = { data };

}

async function initFiller(filler, docId) {

    const form = await Formio.createForm(filler, formOptions);
    form.submission = { data };
    setTimeout(() => dataString = JSON.stringify(form.data), 100);
    setTimeout(() => dataString = JSON.stringify(form.data), 500);
    setTimeout(() => dataString = JSON.stringify(form.data), 2000);

    form.on("change", x => persistChanges(docId, x.data));
    document.querySelector("#controller .save").addEventListener("click", async () => {

        const docURL = await buildSleeperServiceURL(`documents/${tenantSegment}/${docId}/parts/application`);
        const headers = new Headers({ "content-type": "application/json" });
        await decorateHeaders(headers);
        const body = JSON.stringify({ data: form.data });
        const method = "PUT";
        const resp = await fetch(docURL, { method, headers, body });
        if (resp.ok) {
            history.back();
        }
        else
            console.error(resp.status, resp.statusText);

    });

    document.querySelector("#controller .reset").addEventListener("click", () => {

        if (confirmDataLoss())
            form.submission = { data };

    });

    document.querySelector("#controller .cancel").addEventListener("click", () => {

        if (confirmDataLoss())
            history.back();

    });

    function confirmDataLoss() {

        return (JSON.stringify(form.data) === dataString)
            ||
            confirm("This will discard your unsaved changes. Are you sure?");

    }

}

function persistChanges(docId, data) {

    sessionStorage.setItem(`${docId}-working`, JSON.stringify(data));

}

async function initPreview(editor, docId, headers) {

    await Formio.createForm(editor, formOptions);
    document.querySelector("#controller button").addEventListener("click", () => history.back());

}

async function initEditor(editor, docId, headers) {

    const builder = await Formio.builder(
        editor,
        formOptions,
        builderOptions
    );
    schemaString = JSON.stringify(builder.schema);

    builder.on("saveComponent", () => {

        localStorage.setItem("working-form-build", JSON.stringify(builder.schema));

    });


    document.querySelector("#controller .cancel").addEventListener("click", () => {

        if (confirmDataLoss())
            history.back();

    });

    document.querySelector("#controller .save").addEventListener("click", async () => {

        const data = JSON.stringify({
            version,
            schema: builder.schema
        });
        const contentURL = await buildSleeperServiceURL(`documents/${tenantSegment}/${docId}/content`);
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

    function confirmDataLoss() {

        return (JSON.stringify(builder.schema) === schemaString)
            ||
            confirm("This will discard your unsaved changes. Are you sure?");

    }
}
