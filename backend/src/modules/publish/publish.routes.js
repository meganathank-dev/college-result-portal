import { Router } from "express";
import {
  publishExamSession,
  getAllPublishSnapshots,
  getPublishSnapshotById
} from "./publish.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  publishExamSessionSchema,
  publishSnapshotIdParamSchema
} from "./publish.validation.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import { ROLES } from "../../config/constants.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/publish-exam-session",
  validate(publishExamSessionSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  publishExamSession
);

router.get(
  "/snapshots",
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.VERIFIER
  ),
  getAllPublishSnapshots
);

router.get(
  "/snapshots/:publishSnapshotId",
  validate(publishSnapshotIdParamSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.VERIFIER
  ),
  getPublishSnapshotById
);

export default router;