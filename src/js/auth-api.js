import "https://alcdn.msauth.net/browser/2.14.1/js/msal-browser.min.js";
import { msalConfig, tokenRequest } from "./auth-config.js";

const msalInstance = new msal.PublicClientApplication(msalConfig);

export async function decorateHeaders(headers) {

    await msalInstance.handleRedirectPromise();
    const [account] = msalInstance.getAllAccounts();
    console.log(account);
    const resp = await msalInstance.acquireTokenSilent({
        ...tokenRequest,
        account
    });
    headers.append("Authorization", `Bearer ${resp.accessToken}`);

}