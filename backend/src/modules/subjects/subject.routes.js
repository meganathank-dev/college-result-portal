import { Router } from "express";
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  toggleSubjectStatus
} from "./subject.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createSubjectSchema,
  updateSubjectSchema,
  subjectIdParamSchema
} from "./subject.validation.js";
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
  getAllSubjects
);

router.get(
  "/:subjectId",
  validate(subjectIdParamSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR,
    ROLES.VERIFIER
  ),
  getSubjectById
);

router.post(
  "/",
  validate(createSubjectSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  createSubject
);

router.put(
  "/:subjectId",
  validate(updateSubjectSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  updateSubject
);

router.patch(
  "/:subjectId/toggle-status",
  validate(subjectIdParamSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  toggleSubjectStatus
);

export default router;