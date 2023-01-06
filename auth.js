const store = new session.MemoryStore();

app.use(
    session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: true,
        store,
        cookie: { httpOnly: true, secure: false },
    })
);


const protect = (req, res, next) => {
    const { authenticated } = req.session;

    if (!authenticated) {
        res.sendStatus(401);
    } else {
        next();
    }
};

app.get("/login", (req, res) => {
    const { authenticated } = req.session;

    if (!authenticated) {
        req.session.authenticated = true;
        res.send("Successfully authenticated");
    } else {
        res.send("Already authenticated");
    }
});

app.get("/logout", protect, (req, res) => {
    req.session.destroy(() => {
        res.send("Successfully logged out");
    });
});
