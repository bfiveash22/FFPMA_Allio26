import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import path from "path";
import { startScheduler, stopScheduler } from "./services/scheduler";
import { startAgentScheduler, stopAgentScheduler, seedInitialTasks } from "./services/agent-scheduler";
import { startOpenClawMonitor } from "./services/openclaw-monitor";
import { seedPrograms } from "./seed-programs";
import { seedIVTraining } from "./seeds/iv-training-seed";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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
        const jsonStr = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${jsonStr.length > 500 ? jsonStr.substring(0, 500) + '...[truncated]' : jsonStr}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // Serve generated images from attached_assets/generated_images
  app.use('/generated', express.static(path.join(process.cwd(), 'attached_assets', 'generated_images')));

  app.use('/downloads', express.static(path.join(process.cwd(), 'public'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
      }
    }
  }));

  app.get('/api/download/agent-guide', (_req, res) => {
    const filePath = path.join(process.cwd(), 'public', 'ALLIO_Agent_Network_Guide.pdf');
    res.download(filePath, 'ALLIO_Agent_Network_Guide.pdf');
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      
      // Start ATHENA's 6-hour report scheduler
      startScheduler();
      
      // Start OpenClaw Database Bridge Staleness Monitor
      startOpenClawMonitor();
      
      seedInitialTasks().then(result => {
        if (result.created > 0) {
          log(`Seeded ${result.created} initial agent tasks`, 'startup');
        }
        startAgentScheduler();
      });

      seedPrograms().then(() => {
        log('Validated FFPMA premium clinical programs database', 'startup');
      }).catch(err => {
        log(`Failed to seed programs: ${err.message}`, 'error');
      });

      seedIVTraining().then(() => {
        log('Validated FFPMA IV Therapy Certification module', 'startup');
      }).catch(err => {
        log(`Failed to seed IV training: ${err.message}`, 'error');
      });
    },
  );

  function gracefulShutdown(signal: string) {
    log(`Received ${signal}. Shutting down gracefully...`, 'system');
    stopAgentScheduler();
    stopScheduler();
    httpServer.close(() => {
      log('HTTP server closed', 'system');
      process.exit(0);
    });
    setTimeout(() => {
      log('Forcing shutdown after timeout', 'system');
      process.exit(1);
    }, 5000);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled Rejection: ${reason}`, 'error');
  });

  process.on('uncaughtException', (error) => {
    log(`Uncaught Exception: ${error.message}`, 'error');
    gracefulShutdown('uncaughtException');
  });
})();
