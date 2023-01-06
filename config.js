const { debugProxyErrorsPlugin, loggerPlugin, errorResponsePlugin, proxyEventsPlugin } = require("http-proxy-middleware");
module.exports = {
  port: process.env.PORT || 3000,
  rateLimitOptions: {
    windowMs: 5 * 60 * 1000,
    max: 2000,
  },
  proxyCommon: {
    plugins: [debugProxyErrorsPlugin, loggerPlugin, errorResponsePlugin, proxyEventsPlugin],
  },
  proxies: [
    {
      "target": "http://127.0.0.1",
      domain: "localhost",
      router: () => {
        return {
          protocol: "http:", // The : is required
          host: "127.0.0.1",
          port: 8080,
        };
      }
    },
    {
      "target": "http://127.0.0.1",
      domain: "test.local",
      router: () => {
        return {
          protocol: "http:",
          host: "127.0.0.1",
          port: 8080,
        };
      },
    },
  ],
};
