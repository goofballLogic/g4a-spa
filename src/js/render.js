export function render(container) {
    const url = new URL(location.href);
    const path = url.searchParams.get("_") || "/";
    let className = (path && path !== "/") ? path : "home";
    if (container.className == className) return;
    className = className.replace(/^\//, "").replace(/\//g, "__");
    const template = document.querySelector(`template#${className}`);
    const content = template.content.cloneNode(true);
    container.innerHTML = "";
    container.appendChild(content);
    container.className = className;
}