import { Router } from "express";
import {
  processSingleResult,
  processExamSessionResults,
  getAllProcessedResults,
  getProcessedResultById,
  getAllSemesterSummaries,
  getSemesterSummaryById
} from "./result.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  processSingleResultSchema,
  processExamSessionResultsSchema,
  processedResultIdParamSchema,
  semesterSummaryIdParamSchema
} from "./result.validation.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import { ROLES } from "../../config/constants.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/process-single",
  validate(processSingleResultSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN, ROLES.VERIFIER),
  processSingleResult
);

router.post(
  "/process-exam-session",
  validate(processExamSessionResultsSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN, ROLES.VERIFIER),
  processExamSessionResults
);

router.get(
  "/processed-results",
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.VERIFIER
  ),
  getAllProcessedResults
);

router.get(
  "/processed-results/:processedResultId",
  validate(processedResultIdParamSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.VERIFIER
  ),
  getProcessedResultById
);

router.get(
  "/semester-summaries",
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.VERIFIER
  ),
  getAllSemesterSummaries
);

router.get(
  "/semester-summaries/:semesterSummaryId",
  validate(semesterSummaryIdParamSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.VERIFIER
  ),
  getSemesterSummaryById
);

export default router;