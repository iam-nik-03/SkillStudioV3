import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userStorage, User } from "../storage/userStorage.js";

import { SERVER_CONFIG } from "../config/env.js";

const JWT_SECRET = SERVER_CONFIG.JWT_SECRET;

export const userAuthController = {
  signup: async (req: Request, res: Response) => {
    const { name, email, phoneNumber, password, confirmPassword } = req.body;

    if (!name || !email || !phoneNumber || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Gmail validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please provide a valid Gmail address" });
    }

    // Phone number validation (exactly 10 digits)
    const sanitizedPhone = phoneNumber.replace(/\D/g, '');
    if (sanitizedPhone.length !== 10) {
      return res.status(400).json({ error: "Phone number must contain exactly 10 digits" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const existingUser = userStorage.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Gmail address already registered" });
    }

    // Create user immediately
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = userStorage.createUser({
      userId: email, // Gmail as userId
      name,
      phoneNumber: sanitizedPhone,
      passwordHash,
      role: 'user'
    });

    // Mark as verified immediately
    userStorage.updateUser(user.userId, { isVerified: true });

    // Auto login
    const token = jwt.sign({ userId: user.userId, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: { userId: user.userId, name: user.name, role: user.role } });
  },

  login: async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Gmail and password are required" });
    }

    // Check for Admin (Strict check for 03xnik@gmail.com)
    const adminEmail = "03xnik@gmail.com";
    const adminPassword = SERVER_CONFIG.ADMIN_PASSWORD;

    if (email === adminEmail && password === adminPassword) {
      const token = jwt.sign({ userId: "admin-id", email: adminEmail, role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.json({ user: { userId: "admin-id", name: "Admin", role: "admin", email: adminEmail } });
    }

    const user = userStorage.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.userId, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: { userId: user.userId, name: user.name, role: user.role } });
  },

  me: async (req: Request, res: Response) => {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
      
      if (decoded.role === 'admin') {
        return res.json({ user: { userId: "admin-id", name: "Admin", role: "admin" } });
      }

      const user = userStorage.findUserById(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({ user: { userId: user.userId, name: user.name, role: user.role } });
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  },

  logout: (req: Request, res: Response) => {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ success: true });
  },

  getAllUsers: (req: Request, res: Response) => {
    // This should be protected by admin middleware
    const users = userStorage.getUsers();
    // Return sanitized users
    res.json(users.map(u => ({
      userId: u.userId, // This is the Gmail
      name: u.name,
      phoneNumber: u.phoneNumber,
      createdAt: u.createdAt,
      isVerified: u.isVerified
    })));
  }
};
