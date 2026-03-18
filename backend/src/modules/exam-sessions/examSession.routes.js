import { Router } from "express";
import {
  createExamSession,
  getAllExamSessions,
  getExamSessionById,
  updateExamSession,
  toggleExamSessionStatus
} from "./examSession.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createExamSessionSchema,
  updateExamSessionSchema,
  examSessionIdParamSchema
} from "./examSession.validation.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import { ROLES } from "../../config/constants.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR,
    ROLES.VERIFIER
  ),
  getAllExamSessions
);

router.get(
  "/:examSessionId",
  validate(examSessionIdParamSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR,
    ROLES.VERIFIER
  ),
  getExamSessionById
);

router.post(
  "/",
  validate(createExamSessionSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  createExamSession
);

router.put(
  "/:examSessionId",
  validate(updateExamSessionSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  updateExamSession
);

router.patch(
  "/:examSessionId/toggle-status",
  validate(examSessionIdParamSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  toggleExamSessionStatus
);

export default router;