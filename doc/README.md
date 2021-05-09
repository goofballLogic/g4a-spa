# Example of calling an Azure function with access token

```
document.addEventListener("DOMContentLoaded", () => {
    const pingButton = document.querySelector("button.ping");
    if (!pingButton) return;
    pingButton.addEventListener("click", async () => {
        const headers = new Headers();
        await decorateHeaders(headers);
        console.log(Array.from(headers.entries()));
        const resp = await fetch(
            "http://localhost:7071/api/ping", //"https://grants4all-hello.azurewebsites.net/api/Hello",
            {
                headers,
                mode: "cors"
            });
        console.log(resp.status);
        const json = await resp.json();
        console.log(json);
    });
});
```

# g4a inbox
This expects a CREATE-only Azure storage blob container into which uploaded files can be deposited, secured with SAS