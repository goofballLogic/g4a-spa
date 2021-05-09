import { inboxContainerURL, sleeperServiceURL } from "./storage-config.js";
import { decorateHeaders } from "./auth-api.js";

let formBuilderPort = null;

async function formBuilderMessageHandler(e) {
    const { data } = e;
    switch (data.type) {
        case "g4a:form-builder-save":
            const { identifier } = await upload(JSON.stringify(data));
            for (let listener of document.querySelectorAll("[data-listener]")) {
                if (listener.dataset.listener === data.type) {
                    if (listener.tagName === "INPUT")
                        listener.value = identifier;
                    else
                        listener.textContent = identifier;
                }
            }
            formBuilderPort.postMessage(`${data.type}-ack`);
            break;
        default:
            console.warn("Unrecognised port message", e.data);
    }
}

window.addEventListener("message", e => {
    if (e.origin !== location.origin) return;
    switch (e.data) {
        case "g4a:form-builder-init":
            if (formBuilderPort) {
                formBuilderPort.removeEventListener("message", formBuilderMessageHandler);
            }
            formBuilderPort = e.ports[0];
            console.log("Listening for messages on", formBuilderPort);
            formBuilderPort.addEventListener("message", formBuilderMessageHandler);
            formBuilderPort.start();
            formBuilderPort.postMessage("g4a:form-builder-init-ack");
            break;
        default:
            console.warn("Unrecognised message", e.data);
    }
});

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

export function handleFormSubmission(content) {
    for (let form of content.querySelectorAll("form")) {
        form.addEventListener("submit", e => {
            if (e.target.classList.contains("sleeper-service")) {
                e.preventDefault();
                handleSleeperServiceFormSubmission(e.target);
            }
        });
    }
}

async function handleSleeperServiceFormSubmission(form) {
    const message = document.createElement("DIV");
    message.className = "message pending";
    message.textContent = "Saving... ";
    for (let button of form.querySelectorAll("button"))
        button.disabled = true;
    form.appendChild(message);
    form.style.position = "relative";
    try {
        const formData = new FormData(form);
        const digest = {};
        for (let [key, val] of formData.entries()) {
            digest[key] = (val instanceof File) ? await upload(val) : val;
        }
        await postToSleeperService(digest);
        message.textContent += "Complete";
        message.classList.add("success");
        console.log("Done");
    } catch (err) {
        message.textContent += err.message || err;
        message.classList.add("failure");
    } finally {
        message.classList.remove("pending");
        setTimeout(() => form.removeChild(message), 5000);
        for (let button of form.querySelectorAll("button"))
            button.disabled = false;
    }
}

async function postToSleeperService(data) {
    const headers = new Headers();
    await decorateHeaders(headers);
    await fetch(sleeperServiceURL, {
        headers,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify(data)
    });
}

async function upload(file) {
    const identifier = `${Date.now()}_${Math.round(Math.random() * 100000000)}`;
    const blockBlobURL = azblob.BlockBlobURL.fromContainerURL(inboxContainerURL, identifier);
    await azblob.uploadBrowserDataToBlockBlob(azblob.Aborter.none, file, blockBlobURL);
    const { name, size, type, lastModified } = file;
    return { name, size, type, lastModified, identifier };
}
