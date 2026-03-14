import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { ENV } from "./env";
import { serveStatic, setupVite } from "./vite";

function normalizeOrigin(origin: string) {
  return origin.replace(/\/+$/, "");
}

function buildAllowedOrigins() {
  return [
    ENV.frontendUrl,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ]
    .filter(Boolean)
    .map(origin => normalizeOrigin(origin));
}

function isAllowedOrigin(origin: string) {
  const normalizedOrigin = normalizeOrigin(origin);
  const allowedOrigins = new Set(buildAllowedOrigins());

  if (allowedOrigins.has(normalizedOrigin)) {
    return true;
  }

  if (ENV.isProduction) {
    try {
      const requestUrl = new URL(normalizedOrigin);
      return requestUrl.protocol === "https:";
    } catch {
      return false;
    }
  }

  try {
    const frontendUrl = ENV.frontendUrl ? new URL(ENV.frontendUrl) : null;
    const requestUrl = new URL(normalizedOrigin);

    if (
      frontendUrl &&
      frontendUrl.hostname.endsWith(".vercel.app") &&
      requestUrl.hostname.endsWith(".vercel.app")
    ) {
      const frontendProject = frontendUrl.hostname.replace(".vercel.app", "");
      const requestProject = requestUrl.hostname.replace(".vercel.app", "");
      const frontendBaseProject = frontendProject.split("-").slice(0, 4).join("-");
      const requestBaseProject = requestProject.split("-").slice(0, 4).join("-");

      return (
        requestProject === frontendProject ||
        requestProject.startsWith(`${frontendProject}-`) ||
        requestBaseProject === frontendBaseProject
      );
    }
  } catch {
    return false;
  }

  return false;
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;

    if (requestOrigin && isAllowedOrigin(requestOrigin)) {
      res.header("Access-Control-Allow-Origin", requestOrigin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    }

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    next();
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000", 10);

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
