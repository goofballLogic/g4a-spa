import { decorateHeaders } from "./auth-api.js";
import { sleeperServiceURL } from "./service-config.js";

document.addEventListener("g4a.login", async e => {

    const account = e.detail?.account;
    const err = e.detail?.err;
    if (!err) {

        const headers = new Headers();
        await decorateHeaders(headers);
        const fetched = await fetch(sleeperServiceURL("initialize"), { method: "POST", headers });
        if (!fetched.ok) {

            err = `An error occurred initializing your data store (${fetched.status} ${fetched.statusText})`;

        }
        const user = await fetched.json();
        sessionStorage.setItem("g4a:tenant", user.defaultTenantId);

    }

    const bodyClassList = document.body.classList;
    const accountNameElements = document.querySelectorAll(".account-name");
    bodyClassList.remove("logged-in");
    bodyClassList.remove("login-error")
    if (err) {
        bodyClassList.add("login-error");
        alert(err);
    } else {
        let accountName = "";
        if (account) {
            bodyClassList.add("logged-in");
            accountName = account.givenName ? `${account.givenName} ${account.familyName}` : account.username
        } else {
            bodyClassList.add("logged-out");
        }
        for (let element of accountNameElements) {
            element.textContent = accountName;
        }
    }

});