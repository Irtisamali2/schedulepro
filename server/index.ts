import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";

// Export for serverless deployment
export async function createApp() {

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple log function (moved from vite.ts to avoid importing Vite)
const log = (message: string) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${message}`);
};

// Health check endpoint - add this early
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root health check fallback
app.get("/", (req: Request, res: Response, next: NextFunction) => {
  // If this is a health check request, respond quickly
  if (req.headers["user-agent"]?.includes("curl")) {
    return res.status(200).json({ status: "ok" });
  }
  // Otherwise, continue with normal routing
  next();
});

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
      log(logLine);
    }
  });
  next();
});

  // Serve marketing site directly
  app.get("/marketing", (req, res) => {
    res.sendFile("marketing-site.html", { root: "." });
  });

  const server = await registerRoutes(app);

  // Fixed error handler - removed invalid asterisks
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Only set up static file serving in development
  if (process.env.NODE_ENV === "development") {
    // Dynamic import to avoid bundling Vite in production
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  }

  return { app, server };
}

// For serverless deployment (Vercel)
if (process.env.DEPLOY_TARGET === "vercel") {
  // Export the app for serverless functions
  // This will be used by /api/index.ts
} else {
  // For local development and other deployments
  (async () => {
    const { app, server } = await createApp();
    
    // Setup production serving for non-Vercel deployments
    if (process.env.NODE_ENV !== "development") {
      const path = await import("path");
      const { fileURLToPath } = await import("url");

      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const publicPath = path.join(__dirname, "public");

      // Serve static files from dist/public
      app.use(express.static(publicPath));

      // Catch-all handler for SPA
      app.get("*", (req, res) => {
        res.sendFile(path.join(publicPath, "index.html"));
      });
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        console.log(`${new Date().toISOString()} serving on port ${port}`);
      },
    );
  })();
}
