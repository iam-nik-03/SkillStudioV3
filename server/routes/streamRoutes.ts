import { Router } from "express";
import { streamController } from "../controllers/streamController.js";

const router = Router();

router.get("/:courseId/:lessonId", streamController.streamLesson);

export default router;
