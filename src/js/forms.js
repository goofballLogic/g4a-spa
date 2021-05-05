import { inboxContainerURL, sleeperServiceURL } from "./storage-config.js";
import { decorateHeaders } from "./auth-api.js";

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
