function logger(req, res, next) {
    const inicio = Date.now();

    res.on("finish", () => {
        const ms = Date.now() - inicio;
        console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms} ms)`);
    });

    next();
}

module.exports = logger;
