
(function (h, o, u, n, d) {
    h = h[d] = h[d] || { q: [], onReady: function (c) { h.q.push(c) } }
    d = o.createElement(u); d.async = 1; d.src = n
    n = o.getElementsByTagName(u)[0]; n.parentNode.insertBefore(d, n)
})(
    window,
    document,
    'script',
    'https://www.datadoghq-browser-agent.com/datadog-rum.js',
    'DD_RUM'
)
DD_RUM.onReady(function () {
    DD_RUM.init({
        clientToken: 'pub29f4a0f79842b603a94180f4de352eed',
        applicationId: 'a595d77a-5ae2-42dd-acd1-48b90e48bdcd',
        site: 'datadoghq.eu',
        service: 'g4a',
        // Specify a version number to identify the deployed version of your application in Datadog
        // version: '1.0.0',
        sampleRate: 100,
        trackInteractions: true,
    })
});
