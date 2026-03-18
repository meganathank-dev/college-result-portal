import { Router } from "express";
import {
  searchPublishedResult,
  getPublishedResultHistory,
  downloadPublishedResultPdf
} from "./publicResult.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  searchPublishedResultSchema,
  registerNumberParamSchema
} from "./publicResult.validation.js";

const router = Router();

router.post("/search", validate(searchPublishedResultSchema), searchPublishedResult);

router.post("/download-pdf", validate(searchPublishedResultSchema), downloadPublishedResultPdf);

router.get(
  "/history/:registerNumber",
  validate(registerNumberParamSchema),
  getPublishedResultHistory
);

export default router;