import "../lib/azure-storage-blob.min.js";

export const inboxContainerURL = new azblob.ContainerURL(
    `https://grants4allinbox.blob.core.windows.net/inbox?sp=c&st=2021-05-03T09:52:25Z&se=2028-10-31T18:52:25Z&spr=https&sv=2020-02-10&sr=c&sig=IvDeDxCOG7Q7uxzR%2FJC1eLDWVWSoBe9G02Xxn%2BKSI4w%3D`,
    azblob.StorageURL.newPipeline(new azblob.AnonymousCredential)
);

const sleeperServiceRoot = "https://g4a-sleeper-service.azurewebsites.net/api/";

export function sleeperServiceURL(name) {

    const slash = name.indexOf("/");
    const tln = (slash > -1) ? name.substring(0, slash) : name;
    const baseURL = localStorage.getItem(`g4a.sleeper-service-${tln}`) || `${sleeperServiceRoot}${tln}`;
    const url = (slash > -1) ? `${baseURL}${name.substring(slash)}` : baseURL;
    return new URL(url);

}