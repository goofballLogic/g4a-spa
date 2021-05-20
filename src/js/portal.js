import { sleeperServiceURL } from "./service-config.js";
import { emplaceTextContent } from "./emplace.js";

const DOMContentLoaded = new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve));

(async function () {

    const ptid = new URL(location.href).searchParams.get("ptid");
    if (!ptid) throw new Error("Unable to determine tenant");
    const url = sleeperServiceURL(`/public/tenants/${ptid}`);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Unable to fetch tenant details ${resp.statusText} (${resp.status})`);
    const data = await resp.json();
    if (!(data && data.item)) throw new Error(`Failed to fetch tenant details ${JSON.stringify(data)}`);
    document.title = data.item.displayName;
    await DOMContentLoaded;
    const header = document.querySelector("body > header");
    emplaceTextContent(header, data.item);

}());