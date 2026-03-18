import { Router } from "express";
import {
  createGradingPolicy,
  getAllGradingPolicies,
  getGradingPolicyById,
  updateGradingPolicy,
  toggleGradingPolicyStatus
} from "./gradingPolicy.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createGradingPolicySchema,
  updateGradingPolicySchema,
  gradingPolicyIdParamSchema
} from "./gradingPolicy.validation.js";
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
  getAllGradingPolicies
);

router.get(
  "/:gradingPolicyId",
  validate(gradingPolicyIdParamSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR,
    ROLES.VERIFIER
  ),
  getGradingPolicyById
);

router.post(
  "/",
  validate(createGradingPolicySchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  createGradingPolicy
);

router.put(
  "/:gradingPolicyId",
  validate(updateGradingPolicySchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  updateGradingPolicy
);

router.patch(
  "/:gradingPolicyId/toggle-status",
  validate(gradingPolicyIdParamSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  toggleGradingPolicyStatus
);

export default router;