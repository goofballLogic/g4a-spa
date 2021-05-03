import "../lib/azure-storage-blob.min.js";

export const inboxContainerURL = new azblob.ContainerURL(
    `https://grants4allinbox.blob.core.windows.net/inbox?sp=c&st=2021-05-03T09:52:25Z&se=2028-10-31T18:52:25Z&spr=https&sv=2020-02-10&sr=c&sig=IvDeDxCOG7Q7uxzR%2FJC1eLDWVWSoBe9G02Xxn%2BKSI4w%3D`,
    azblob.StorageURL.newPipeline(new azblob.AnonymousCredential));

export const sleeperServiceURL = new URL(
    localStorage.getItem("g4a.sleeper-service") ||
    "https://g4a-sleeper-service.azurewebsites.net/api/service"
);