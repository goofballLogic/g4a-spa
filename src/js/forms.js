import { inboxContainerURL, sleeperServiceURL } from "./service-config.js";
import { decorateHeaders } from "./auth-api.js";

export function handleFormMutations(content) {

    for (let form of content.querySelectorAll("form")) {

        for (let toggler of form.querySelectorAll("input[data-toggler]")) {

            const { name, value } = toggler;
            const toggledClass = `.${name}-toggled`;
            const toggled = form.querySelectorAll(toggledClass);
            function updateToggleState() {

                for (let t of toggled) {

                    if (toggler.checked && t.classList.contains(value)) {

                        t.classList.add("show");
                        t.classList.remove("hide");

                    } else {

                        t.classList.add("hide");
                        t.classList.remove("show");

                    }

                }

            }
            updateToggleState();
            toggler.addEventListener("change", updateToggleState);

        }

    }

}

export function handleFormSubmission(content, params) {

    for (let form of content.querySelectorAll("form")) {

        form.addEventListener("submit", e => {

            const { classList } = e.target;
            if (classList.contains("sleeper-service")) {

                e.preventDefault();
                handleSleeperServiceFormSubmission(e.target);

            }

            if (classList.contains("doc-server") || classList.contains("doc-server-for-user") || classList.contains("doc-server-for-portal")) {

                e.preventDefault();
                const docServerOwner = ownerForDocServer(e.target, params);
                handleDocServerFormSubmission(docServerOwner, e.target);

            }

            if (classList.contains("cog-initialize")) {

                e.preventDefault();
                handleCogInitialize(e.target);
            }
        });

    }

}

function ownerForDocServer(form, params) {

    if (form.classList.contains("doc-server-for-user"))
        return "users/me";
    if (form.classList.contains("doc-server-for-portal"))
        return params.portal_tid;
    return sessionStorage.getItem("g4a:tenant");

}

async function handleCogInitialize(form) {

    const data = new FormData(form);
    const userId = data.get("userId");
    if (!userId) throw new Error("No user id");
    const headers = new Headers();
    await decorateHeaders(headers);

    const url = new URL(sleeperServiceURL("initialize"));
    url.searchParams.set("userId", userId);
    await fetch(url, {
        headers,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify(data)
    });

}

async function handleDocServerFormSubmission(owner, form) {

    await runFormSubmission(form, async () => {

        const formData = new FormData(form);
        const id = formData.get("id");

        if (id) {

            await patchToSleeperService(sleeperServiceURL(`documents/${owner}/${id}`), formData);

        } else {

            await postToSleeperService(sleeperServiceURL(`documents/${owner}`), formData);

        }

    });

}

async function handleSleeperServiceFormSubmission(form) {
    await runFormSubmission(form, async () => {
        const formData = new FormData(form);
        const digest = {};
        for (let [key, val] of formData.entries()) {
            digest[key] = (val instanceof File) ? await upload(val) : val;
        }
        await postToSleeperService(digest);
    });
}

async function runFormSubmission(form, strategy) {
    const message = document.createElement("DIV");
    message.className = "message pending";
    message.textContent = "Saving... ";
    for (let button of form.querySelectorAll("button"))
        button.disabled = true;
    form.appendChild(message);
    let redirecting = false;
    try {
        await strategy();
        message.textContent += "Complete";
        message.classList.add("success");
        const { submitNext } = form.dataset;
        if (submitNext) {
            redirecting = location.href !== submitNext;
            location.href = submitNext;
        }

    } catch (err) {
        message.textContent += err.message || err;
        message.classList.add("failure");
    } finally {
        message.classList.remove("pending");
        setTimeout(() => form.removeChild(message), 5000);
        if (!redirecting) {
            for (let button of form.querySelectorAll("button"))
                button.disabled = false;
        }
    }
}

async function patchToSleeperService(url, data) {

    return await fetchToSleeperService(data, url, "PATCH");

}

async function postToSleeperService(url, data) {

    return await fetchToSleeperService(data, url, "POST");

}

async function fetchToSleeperService(data, url, method) {
    const headers = new Headers();
    await decorateHeaders(headers);
    const contentType = "application/json";
    const body = JSON.stringify(
        data instanceof FormData
            ? Object.fromEntries(data.entries())
            : data
    );
    const resp = await fetch(url, { headers, method, contentType, body });
    if (!resp.ok)
        throw new Error(`${resp.status} ${resp.statusText}`);
    return {
        status: resp.status,
        body: await extractBody(resp)
    };
}

async function extractBody(resp) {

    const contentType = resp.headers.get("content-type");
    return contentType?.startsWith("application/json")
        ? await resp.json()
        : contentType?.startsWith("text")
            ? await resp.text()
            : null;

}

async function upload(file) {
    const identifier = `${Date.now()}_${Math.round(Math.random() * 100000000)}`;
    const blockBlobURL = azblob.BlockBlobURL.fromContainerURL(inboxContainerURL, identifier);
    await azblob.uploadBrowserDataToBlockBlob(azblob.Aborter.none, file, blockBlobURL);
    const { name, size, type, lastModified } = file;
    return { name, size, type, lastModified, identifier };
}
