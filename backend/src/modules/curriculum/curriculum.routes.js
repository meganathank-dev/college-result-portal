import { Router } from "express";
import {
  createCurriculumMapping,
  getCurriculumMappings,
  getCurriculumMappingById,
  updateCurriculumMapping
} from "./curriculum.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createCurriculumMappingSchema,
  updateCurriculumMappingSchema,
  curriculumMappingIdParamSchema
} from "./curriculum.validation.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getCurriculumMappings);
router.get("/:mappingId", validate(curriculumMappingIdParamSchema), getCurriculumMappingById);
router.post("/", validate(createCurriculumMappingSchema), createCurriculumMapping);
router.put(
  "/:mappingId",
  validate(curriculumMappingIdParamSchema),
  validate(updateCurriculumMappingSchema),
  updateCurriculumMapping
);

export default router;