import { decorateHeaders } from "./auth-api.js";
import { buildSleeperServiceURL } from "./queries.js";
import { determineAuthenticationStatus } from "./auth.js";

const url = new URL(location.href);
const docId = url.searchParams.get("id");
if (!docId) history.back();
const tenantSegment = url.searchParams.get("tid") || "{tenant}";

let data;
let originalDataString;

document.addEventListener("DOMContentLoaded", async () => {

    const editor = document.querySelector(".editor");
    if (!editor) throw new Error("Editor not found");

    const quill = new Quill(editor, { theme: "snow" });
    quill.on("text-change", () => {

        data = quill.getContents();

    });
    const auth = await determineAuthenticationStatus();
    if (!auth.isLoggedIn) throw new Error("Not logged in");

    const { localAccountId } = auth.account;
    const partId = `review-${localAccountId.replace(/-/g, "")}`;
    const partURL = await buildSleeperServiceURL(
        `documents/${tenantSegment}/${docId}/parts/${partId}`
    );

    const headers = new Headers({ "content-type": "application/json" });
    await decorateHeaders(headers);

    try {

        const resp = await fetch(partURL, { headers });
        if (resp.status === 404) {

            console.log("Not found");

        } else if (!resp.ok) {

            throw new Error(`${resp.statusText}`);

        } else {

            data = (await resp.json()).item;
            originalDataString = JSON.stringify(data);

        }
        quill.setContents(data);

    } catch (err) {

        alert(err.stack);
        history.back();

    }

    document.querySelector("#controller .save").addEventListener("click", async () => {

        const body = JSON.stringify(data);
        const method = "PUT";
        const resp = await fetch(partURL, { method, headers, body });
        if (resp.ok) {
            history.back();
        }
        else
            console.error(resp.status, resp.statusText);

    });

    document.querySelector("#controller .reset").addEventListener("click", () => {

        if (confirmDataLoss()) {

            data = JSON.parse(originalDataString);
            quill.setContents(data);

        }

    });

    document.querySelector("#controller .cancel").addEventListener("click", () => {

        if (confirmDataLoss())
            history.back();

    });

    function confirmDataLoss() {

        return (JSON.stringify(data) === originalDataString)
            ||
            confirm("This will discard your unsaved changes. Are you sure?");

    }

});