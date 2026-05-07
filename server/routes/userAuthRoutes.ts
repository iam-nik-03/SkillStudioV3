import { Router } from "express";
import { userAuthController } from "../controllers/userAuthController.js";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/signup", userAuthController.signup);
router.post("/login", userAuthController.login);
router.post("/logout", userAuthController.logout);
router.get("/me", userAuthController.me);

// Admin routes
router.get("/admin/users", authMiddleware, adminMiddleware, userAuthController.getAllUsers);

export default router;
