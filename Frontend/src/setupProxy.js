// src/setupProxy.js
//
// Replaces the static "proxy" field in package.json with a dynamic proxy
// that reads the backend target from BACKEND_URL env var.
//
// In Docker: BACKEND_URL=http://rentsphere-backend:8080  (set in docker-compose.yaml)
// Locally:   BACKEND_URL is unset → falls back to http://localhost:8080
//
// The proxy runs inside the Node.js dev server process (server-side), so it
// CAN resolve Docker internal hostnames — the browser never talks to
// rentsphere-backend directly; it always hits localhost:3000 which forwards.

const { createProxyMiddleware } = require('http-proxy-middleware');

const BACKEND = process.env.BACKEND_URL || 'http://localhost:8080';

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: BACKEND,
      changeOrigin: true,
      logLevel: 'warn',
    })
  );
};
