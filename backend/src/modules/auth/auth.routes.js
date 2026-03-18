import { Router } from "express";
import { login, me } from "./auth.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { loginSchema } from "./auth.validation.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.get("/me", authMiddleware, me);

export default router;