import { Router } from "express";
import {
  createRegulation,
  getAllRegulations,
  getRegulationById,
  updateRegulation,
  toggleRegulationStatus
} from "./regulation.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createRegulationSchema,
  updateRegulationSchema,
  regulationIdParamSchema
} from "./regulation.validation.js";
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
  getAllRegulations
);

router.get(
  "/:regulationId",
  validate(regulationIdParamSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR,
    ROLES.VERIFIER
  ),
  getRegulationById
);

router.post(
  "/",
  validate(createRegulationSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  createRegulation
);

router.put(
  "/:regulationId",
  validate(updateRegulationSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  updateRegulation
);

router.patch(
  "/:regulationId/toggle-status",
  validate(regulationIdParamSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN),
  toggleRegulationStatus
);

export default router;