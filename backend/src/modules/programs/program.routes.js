import { Router } from "express";
import {
  createProgram,
  getPrograms,
  getProgramById,
  updateProgram
} from "./program.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createProgramSchema,
  updateProgramSchema,
  programIdParamSchema
} from "./program.validation.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getPrograms);
router.get("/:programId", validate(programIdParamSchema), getProgramById);
router.post("/", validate(createProgramSchema), createProgram);
router.put(
  "/:programId",
  validate(programIdParamSchema),
  validate(updateProgramSchema),
  updateProgram
);

export default router;