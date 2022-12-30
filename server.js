require("dotenv").config();
const cors = require("cors");
const express = require("express");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const expressWinston = require("express-winston");
const helmet = require("helmet");
const { createProxyMiddleware } = require("http-proxy-middleware");
const responseTime = require("response-time");
const winston = require("winston");
const basicAuth = require("express-basic-auth");

const { port, sessionSecret, rateLimitOptions, proxies } = require("./config");

const app = express();

const store = new session.MemoryStore();

const alwaysAllow = (req, res, next) => {
  next();
};

const protect = (req, res, next) => {
  const { authenticated } = req.session;

  if (!authenticated) {
    res.sendStatus(401);
  } else {
    next();
  }
};

// app.use(
//   basicAuth({
//     users: { admin: "admin" },
//   })
// );

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

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    store,
    cookie: { httpOnly: true, secure: false },
  })
);

app.get("/login", (req, res) => {
  const { authenticated } = req.session;

  if (!authenticated) {
    req.session.authenticated = true;
    res.send("Successfully authenticated");
  } else {
    res.send("Already authenticated");
  }
});

Object.keys(proxies).forEach((path) => {
  const { protected, ...options } = proxies[path];
  const check = protected ? protect : alwaysAllow;
  app.use(path, check, createProxyMiddleware(options));
});

app.get("/logout", protect, (req, res) => {
  req.session.destroy(() => {
    res.send("Successfully logged out");
  });
});

app.get("/", (req, res) => {
  const { name = "user" } = req.query;
  res.send(`Hello ${name}!`);
});

app.get("/protected", protect, (req, res) => {
  const { name = "user" } = req.query;
  res.send(`protected ${name}!`);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
