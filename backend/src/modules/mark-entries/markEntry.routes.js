import { Router } from "express";
import {
  bulkImportMarkEntries,
  bulkUpsertMarkEntries,
  createMarkEntry,
  getAllMarkEntries,
  getMarkEntryById,
  getMarkEntryCandidates,
  getMarkImportCandidates,
  getMarkImportSubjects,
  updateMarkEntry,
  verifyMarkEntry,
  lockMarkEntry
} from "./markEntry.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  bulkImportMarkEntriesSchema,
  bulkUpsertMarkEntriesSchema,
  createMarkEntrySchema,
  getMarkEntryCandidatesSchema,
  getMarkImportCandidatesSchema,
  getMarkImportSubjectsSchema,
  updateMarkEntrySchema,
  markEntryIdParamSchema
} from "./markEntry.validation.js";
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
  getAllMarkEntries
);

router.get(
  "/candidates",
  validate(getMarkEntryCandidatesSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR,
    ROLES.VERIFIER
  ),
  getMarkEntryCandidates
);

router.get(
  "/import-subjects",
  validate(getMarkImportSubjectsSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR,
    ROLES.VERIFIER
  ),
  getMarkImportSubjects
);

router.get(
  "/import-candidates",
  validate(getMarkImportCandidatesSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR,
    ROLES.VERIFIER
  ),
  getMarkImportCandidates
);

router.get(
  "/:markEntryId",
  validate(markEntryIdParamSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR,
    ROLES.VERIFIER
  ),
  getMarkEntryById
);

router.post(
  "/",
  validate(createMarkEntrySchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR
  ),
  createMarkEntry
);

router.post(
  "/import",
  validate(bulkImportMarkEntriesSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR
  ),
  bulkImportMarkEntries
);

router.post(
  "/bulk-upsert",
  validate(bulkUpsertMarkEntriesSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR
  ),
  bulkUpsertMarkEntries
);

router.put(
  "/:markEntryId",
  validate(updateMarkEntrySchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR
  ),
  updateMarkEntry
);

router.patch(
  "/:markEntryId/verify",
  validate(markEntryIdParamSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN, ROLES.VERIFIER),
  verifyMarkEntry
);

router.patch(
  "/:markEntryId/lock",
  validate(markEntryIdParamSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN, ROLES.VERIFIER),
  lockMarkEntry
);

export default router;