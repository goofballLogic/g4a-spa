import "../lib/formiojs/4.13.1/formio.full.min.js";

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

const messages = [];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForMessage(name, timeout = Date.now() + 3000) {
    while (!messages.includes(name)) {
        if (Date.now() > timeout) return false;
        console.log("Polling for", name);
        await delay(300);
    }
    return true;
}

document.addEventListener("DOMContentLoaded", async () => {

    const channel = new MessageChannel();
    channel.port1.addEventListener("message", e => messages.push(e.data));
    channel.port1.start();
    window.opener.postMessage("g4a:form-builder-init", location.origin, [channel.port2]);
    const result = await waitForMessage("g4a:form-builder-init-ack");
    if (!result) throw new Error("Unable to communicate with the page which opened this form builder");

    const builder = await Formio.builder(document.querySelector("#editor"), formOptions, builderOptions);
    builder.on("saveComponent", () => { localStorage.setItem("working-form-build", JSON.stringify(builder.schema)) });

    document.querySelector("#controller button").addEventListener("click", async () => {

        const data = JSON.parse(JSON.stringify({
            type: "g4a:form-builder-save",
            version,
            schema: builder.schema
        }));
        while (messages.length) messages.pop();
        channel.port1.postMessage(data);
        const saveResult = await waitForMessage("g4a:form-builder-save-ack");
        if (!saveResult) throw new Error("Failed to save");
        window.close();
    });

    document.body.classList.add("loaded");

});