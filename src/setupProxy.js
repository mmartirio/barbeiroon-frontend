// Adds security headers to the Create React App development server.
// This file is loaded automatically by react-scripts when present in src/.
module.exports = function (app) {
    app.disable('x-powered-by');

    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        // CSP permissive enough for webpack HMR (inline scripts + eval + websocket)
        res.setHeader(
            'Content-Security-Policy',
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: ws: wss:; frame-ancestors 'self'"
        );
        // Prevent aggressive caching of HTML pages in dev
        if (!req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)(\?|$)/)) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        }
        next();
    });
};
