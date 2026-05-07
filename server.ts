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
  const PORT = SERVER_CONFIG.PORT;

  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.use("/api/auth", userAuthRoutes);
  app.use("/api/gdrive", authMiddleware, authRoutes);
  app.use("/api/import", authMiddleware, importRoutes);
  app.use("/api/stream", authMiddleware, streamRoutes);
  app.use("/api/youtube", youtubeRoutes);
  
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
