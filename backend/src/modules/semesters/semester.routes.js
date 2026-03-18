import { Router } from "express";
import {
  createSemester,
  getAllSemesters,
  getSemesterById,
  updateSemester,
  toggleSemesterStatus
} from "./semester.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createSemesterSchema,
  updateSemesterSchema,
  semesterIdParamSchema
} from "./semester.validation.js";
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
  getAllSemesters
);

router.get(
  "/:semesterId",
  validate(semesterIdParamSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR,
    ROLES.VERIFIER
  ),
  getSemesterById
);

router.post(
  "/",
  validate(createSemesterSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  createSemester
);

router.put(
  "/:semesterId",
  validate(updateSemesterSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  updateSemester
);

router.patch(
  "/:semesterId/toggle-status",
  validate(semesterIdParamSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  toggleSemesterStatus
);

export default router;