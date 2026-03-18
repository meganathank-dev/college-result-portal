import { Router } from "express";
import {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  toggleBatchStatus
} from "./batch.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createBatchSchema,
  updateBatchSchema,
  batchIdParamSchema
} from "./batch.validation.js";
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
  getAllBatches
);

router.get(
  "/:batchId",
  validate(batchIdParamSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR,
    ROLES.VERIFIER
  ),
  getBatchById
);

router.post(
  "/",
  validate(createBatchSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  createBatch
);

router.put(
  "/:batchId",
  validate(updateBatchSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  updateBatch
);

router.patch(
  "/:batchId/toggle-status",
  validate(batchIdParamSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  toggleBatchStatus
);

export default router;