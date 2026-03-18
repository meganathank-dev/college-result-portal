import { Router } from "express";
import { ApiResponse } from "../utils/apiResponse.js";
import authRoutes from "../modules/auth/auth.routes.js";
import departmentRoutes from "../modules/departments/department.routes.js";
import programRoutes from "../modules/programs/program.routes.js";
import regulationRoutes from "../modules/regulations/regulation.routes.js";
import batchRoutes from "../modules/batches/batch.routes.js";
import semesterRoutes from "../modules/semesters/semester.routes.js";
import subjectRoutes from "../modules/subjects/subject.routes.js";
import gradingPolicyRoutes from "../modules/grading-policies/gradingPolicy.routes.js";
import curriculumRoutes from "../modules/curriculum/curriculum.routes.js";
import studentRoutes from "../modules/students/student.routes.js";
import examSessionRoutes from "../modules/exam-sessions/examSession.routes.js";
import examRegistrationRoutes from "../modules/exam-registrations/examRegistration.routes.js";
import markEntryRoutes from "../modules/mark-entries/markEntry.routes.js";
import resultRoutes from "../modules/results/result.routes.js";
import publishRoutes from "../modules/publish/publish.routes.js";
import publicResultRoutes from "../modules/public-results/publicResult.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  return res.status(200).json(
    new ApiResponse(200, "Backend is running", {
      serverTime: new Date().toISOString()
    })
  );
});

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/departments", departmentRoutes);
router.use("/programs", programRoutes);
router.use("/regulations", regulationRoutes);
router.use("/batches", batchRoutes);
router.use("/semesters", semesterRoutes);
router.use("/subjects", subjectRoutes);
router.use("/grading-policies", gradingPolicyRoutes);
router.use("/curriculum-mappings", curriculumRoutes);
router.use("/students", studentRoutes);
router.use("/exam-sessions", examSessionRoutes);
router.use("/exam-registrations", examRegistrationRoutes);
router.use("/mark-entries", markEntryRoutes);
router.use("/results", resultRoutes);
router.use("/publish", publishRoutes);
router.use("/public-results", publicResultRoutes);

export default router;