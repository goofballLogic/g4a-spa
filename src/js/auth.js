import "https://alcdn.msauth.net/browser/2.14.1/js/msal-browser.min.js";
import { msalConfig, loginRequest } from "./auth-config.js";

const msalInstance = new msal.PublicClientApplication(msalConfig);

function dispatchLoginEvent(detail) {
    document.dispatchEvent(new CustomEvent("login", { detail }));
}

export function account() {
    return { ...currentAccount };
}

let currentAccount = null;

(async function () {
    try {
        await msalInstance.handleRedirectPromise();
        const [account] = msalInstance.getAllAccounts();
        if (account) {
            currentAccount = {
                id: account.homeAccountId,
                username: account.username,
                givenName: account.idTokenClaims?.given_name,
                familyName: account.idTokenClaims?.family_name,
            };
            dispatchLoginEvent({
                account: { ...currentAccount }
            });
        } else {
            currentAccount = null;
            document.dispatchEvent(new CustomEvent("login", {}));
        }
    } catch (err) {
        document.dispatchEvent(new CustomEvent("login", { err }))
    }
}());

export function signIn() {

    msalInstance.loginRedirect(loginRequest);
}

export function signOut() {

    msalInstance.logoutRedirect();

}