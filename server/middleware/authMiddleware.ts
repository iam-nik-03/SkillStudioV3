import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { SERVER_CONFIG } from "../config/env.js";

const JWT_SECRET = SERVER_CONFIG.JWT_SECRET;

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: "Unauthorized: Admin access required" });
  }
  
  // Final safeguard: Verify email if present in token
  // If the admin-id is used during login, we trust the role from the token
  // but we can add more checks if needed.
  next();
};
