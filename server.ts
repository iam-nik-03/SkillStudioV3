import express from "express";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { SERVER_CONFIG, validateConfig } from "./server/config/env.js";

// Validate env on startup
validateConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import userAuthRoutes from "./server/routes/userAuthRoutes.js";
import authRoutes from "./server/routes/authRoutes.js";
import importRoutes from "./server/routes/importRoutes.js";
import streamRoutes from "./server/routes/streamRoutes.js";
import youtubeRoutes from "./server/routes/youtubeRoutes.js";
import { authMiddleware } from "./server/middleware/authMiddleware.js";

async function startServer() {
  const app = express();
  const PORT = SERVER_CONFIG.PORT || process.env.PORT || 3000;

  // -----------------------------
  // Middleware
  // -----------------------------
  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());

  // -----------------------------
  // API Routes
  // -----------------------------
  app.use("/api/auth", userAuthRoutes);
  app.use("/api/gdrive", authMiddleware, authRoutes);
  app.use("/api/import", authMiddleware, importRoutes);
  app.use("/api/stream", authMiddleware, streamRoutes);
  app.use("/api/youtube", youtubeRoutes);

  // -----------------------------
  // Health Check Route
  // -----------------------------
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
    });
  });

  // -----------------------------
  // Development Mode (Vite)
  // -----------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    // -----------------------------
    // Production Static Files
    // -----------------------------
    const distPath = path.join(__dirname, "dist");

    app.use(express.static(distPath));

    // -----------------------------
    // SPA Fallback Route
    // IMPORTANT:
    // Avoid using app.get("*")
    // because newer path-to-regexp versions crash on Render
    // -----------------------------
    app.use((req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // -----------------------------
  // Global Error Handler
  // -----------------------------
  app.use((err, req, res, next) => {
    console.error("[SERVER ERROR]", err);

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  });

  // -----------------------------
  // Start Server
  // -----------------------------
  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `[SERVER] Running on http://0.0.0.0:${PORT} (${process.env.NODE_ENV || "development"})`
    );
  });
}

// -----------------------------
// Startup Error Catch
// -----------------------------
startServer().catch((err) => {
  console.error("[STARTUP ERROR]", err);
  process.exit(1);
});