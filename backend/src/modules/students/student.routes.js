import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  toggleStudentAcademicStatus,
  importStudents,
  downloadStudentImportTemplate
} from "./student.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createStudentSchema,
  updateStudentSchema,
  studentIdParamSchema
} from "./student.validation.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import { ROLES } from "../../config/constants.js";

const router = Router();

const uploadDir = "uploads/student-imports";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${baseName}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowedExtensions = [".xlsx", ".xls"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error("Only .xlsx and .xls files are allowed"));
  }

  cb(null, true);
};

const upload = multer({ storage, fileFilter });

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
  getAllStudents
);

router.get(
  "/:studentId",
  validate(studentIdParamSchema),
  roleMiddleware(
    ROLES.SUPER_ADMIN,
    ROLES.EXAM_CELL_ADMIN,
    ROLES.DEPARTMENT_ADMIN,
    ROLES.DATA_ENTRY_OPERATOR,
    ROLES.VERIFIER
  ),
  getStudentById
);

router.get(
  "/import/template",
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN, ROLES.DEPARTMENT_ADMIN),
  downloadStudentImportTemplate
);

router.post(
  "/",
  validate(createStudentSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN, ROLES.DEPARTMENT_ADMIN),
  createStudent
);

router.post(
  "/import",
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN, ROLES.DEPARTMENT_ADMIN),
  upload.single("file"),
  importStudents
);

router.put(
  "/:studentId",
  validate(updateStudentSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN, ROLES.DEPARTMENT_ADMIN),
  updateStudent
);

router.patch(
  "/:studentId/toggle-status",
  validate(studentIdParamSchema),
  roleMiddleware(ROLES.SUPER_ADMIN, ROLES.EXAM_CELL_ADMIN, ROLES.DEPARTMENT_ADMIN),
  toggleStudentAcademicStatus
);

export default router;