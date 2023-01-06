require("dotenv").config();
const { readFileSync } = require('fs');
const { createServer } = require('https');
const cors = require("cors");
const express = require("express");
const vhost = require("vhost");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const expressWinston = require("express-winston");
const helmet = require("helmet");
const { createProxyMiddleware } = require("http-proxy-middleware");
const responseTime = require("response-time");
const winston = require("winston");

const { port, rateLimitOptions, proxies, credentials, proxyCommon } = require("./config");

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(responseTime());
app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.json(),
    statusLevels: true,
    meta: false,
    level: "debug",
    msg: "HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms",
    expressFormat: true,
    ignoreRoute() {
      return false;
    },
  })
);
app.use(cors());
app.use(rateLimit(rateLimitOptions));

proxies.forEach(proxyOptions => {
  const options = {
    ...proxyCommon,
    target: proxyOptions.target || proxyOptions.host,
    changeOrigin: proxyOptions.changeOrigin || true,
    ws: proxyOptions.ws || false,
    ...proxyOptions,
  }

  app.use(vhost(proxyOptions.domain, createProxyMiddleware(options)));
})

if (!credentials) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${port}`);
  });
} else {
  const sslCredentials = {
    key: readFileSync(credentials.key, 'utf8'),
    cert: readFileSync(credentials.cert, 'utf8'),
  };
  const httpsServer = createServer(sslCredentials, app);
  httpsServer.listen(443);
}

