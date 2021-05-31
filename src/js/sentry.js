Sentry.init({
    dsn: "https://433ad732b6834d9eb46d96e4bc1b85c0@o764965.ingest.sentry.io/5794213",
    integrations: [new Sentry.Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});