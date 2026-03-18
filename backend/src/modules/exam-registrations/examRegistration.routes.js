import { Router } from "express";
import {
  autoSyncCurrentExamRegistrations,
  createExamRegistration,
  getAllExamRegistrations,
  getArrearCandidates,
  getExamRegistrationById,
  registerArrearCandidates,
  updateExamRegistration,
  toggleExamRegistrationEligibility
} from "./examRegistration.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  autoSyncCurrentExamRegistrationsSchema,
  createExamRegistrationSchema,
  examRegistrationIdParamSchema,
  getArrearCandidatesSchema,
  registerArrearCandidatesSchema,
  updateExamRegistrationSchema
} from "./examRegistration.validation.js";
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
  getAllExamRegistrations
);

router.get(
  "/arrear-candidates",
  validate(getArrearCandidatesSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR,
    ROLES.VERIFIER
  ),
  getArrearCandidates
);

router.get(
  "/:examRegistrationId",
  validate(examRegistrationIdParamSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR,
    ROLES.VERIFIER
  ),
  getExamRegistrationById
);

router.post(
  "/",
  validate(createExamRegistrationSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN, ROLES.DEPARTMENT_ADMIN),
  createExamRegistration
);

router.post(
  "/auto-sync-current",
  validate(autoSyncCurrentExamRegistrationsSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN, ROLES.DEPARTMENT_ADMIN),
  autoSyncCurrentExamRegistrations
);

router.post(
  "/register-arrears",
  validate(registerArrearCandidatesSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN, ROLES.DEPARTMENT_ADMIN),
  registerArrearCandidates
);

router.put(
  "/:examRegistrationId",
  validate(updateExamRegistrationSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN, ROLES.DEPARTMENT_ADMIN),
  updateExamRegistration
);

router.patch(
  "/:examRegistrationId/toggle-eligibility",
  validate(examRegistrationIdParamSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN, ROLES.DEPARTMENT_ADMIN),
  toggleExamRegistrationEligibility
);

export default router;