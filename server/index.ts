import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
//import { setupVite, serveStatic, log } from "./vite";
//import { initializeNotificationSystem } from "./notifications";
// Attempt to force inclusion of the Linux-specific Rollup package
//import '@rollup/rollup-linux-x64-gnu';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      //log(logLine);
    }
  });

  next();
});

// Call registerRoutes and initializeNotificationSystem directly.
// These should ideally be synchronous for a serverless function's cold start,
// or their async operations should be handled internally without top-level await.
//registerRoutes(app);
//initializeNotificationSystem();
//log("Notification system initialized");

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  // In serverless, re-throwing might not be ideal; logging is usually sufficient.
  // For now, let's keep it as is, but be aware.
  //throw err;
});

// Remove the Vite setup for non-development, as serverless functions don't serve static files directly.
// The frontend is served by Netlify's static hosting.
// The `serveStatic(app)` part is also not needed for the API function.
// The `setupVite` part is only for local dev.
// So, remove the entire `if (app.get("env") === "development") { ... } else { ... }` block.
// If you need development server functionality, it's separate from the Netlify Function.

// Remove the server.listen part entirely, as serverless functions don't listen on ports.

// Export the app instance for serverless-http
export default app;