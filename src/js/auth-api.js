import "https://alcdn.msauth.net/browser/2.14.1/js/msal-browser.min.js";
import { msalConfig, tokenRequest } from "./auth-config.js";

const msalInstance = new msal.PublicClientApplication(msalConfig);
let tokenResponseCache = null;

export async function decorateHeaders(headers) {

    const token = await ensureTokenAcquisition();
    if (token)
        headers.append("Authorization", `Bearer ${token}`);

}

async function ensureTokenAcquisition() {

    if (tokenResponseCache) {

        if (tokenResponseCache.expiresOn <= new Date())
            tokenResponseCache = null;

    }
    if (!tokenResponseCache) {

        if (msalInstance.getAllAccounts().length) {

            await msalInstance.handleRedirectPromise();
            const [account] = msalInstance.getAllAccounts();
            const resp = await msalInstance.acquireTokenSilent({
                ...tokenRequest,
                account
            });
            tokenResponseCache = resp;

        }

    }
    return tokenResponseCache?.accessToken;

}
