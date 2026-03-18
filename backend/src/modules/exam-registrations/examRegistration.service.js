import mongoose from "mongoose";
import { ExamRegistration } from "./examRegistration.model.js";
import { ExamSession } from "../exam-sessions/examSession.model.js";
import { Student } from "../students/student.model.js";
import { Subject } from "../subjects/subject.model.js";
import { Semester } from "../semesters/semester.model.js";
import { CurriculumMapping } from "../curriculum/curriculumMapping.model.js";
import { ProcessedResult } from "../results/processedResult.model.js";
import { ApiError } from "../../utils/apiError.js";
import { ATTEMPT_TYPES, PASS_STATUSES } from "../../config/constants.js";

const ensureValidObjectId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${label} ID`);
  }
};

const ensureExamSessionExists = async (examSessionId) => {
  ensureValidObjectId(examSessionId, "exam session");
  const examSession = await ExamSession.findById(examSessionId);
  if (!examSession) throw new ApiError(404, "Exam session not found");
  return examSession;
};

const ensureStudentExists = async (studentId) => {
  ensureValidObjectId(studentId, "student");
  const student = await Student.findById(studentId);
  if (!student) throw new ApiError(404, "Student not found");
  return student;
};

const ensureSubjectExists = async (subjectId) => {
  ensureValidObjectId(subjectId, "subject");
  const subject = await Subject.findById(subjectId);
  if (!subject) throw new ApiError(404, "Subject not found");
  return subject;
};

const ensureSemesterExists = async (semesterId) => {
  ensureValidObjectId(semesterId, "semester");
  const semester = await Semester.findById(semesterId);
  if (!semester) throw new ApiError(404, "Semester not found");
  return semester;
};

const populateExamRegistration = (query) =>
  query
    .populate(
      "examSessionId",
      "name examMonth examYear sessionCategory status parentExamSessionId",
    )
    .populate({
      path: "studentId",
      select:
        "registerNumber fullName academicStatus currentSemesterId programId batchId regulationId departmentId",
      populate: [
        {
          path: "departmentId",
          select: "name code shortName status",
        },
        {
          path: "currentSemesterId",
          select: "number label displayOrder isActive",
        },
        {
          path: "programId",
          select: "name code shortName degreeType status",
        },
        {
          path: "batchId",
          select: "label startYear endYear isActive",
        },
        {
          path: "regulationId",
          select:
            "name code effectiveFromBatchYear effectiveToBatchYear isActive",
        },
      ],
    })
    .populate("subjectId", "code name shortName subjectType credits isActive")
    .populate("sourceSemesterId", "number label displayOrder isActive");

const validateExamRegistrationBusinessRules = async ({
  examSessionId,
  studentId,
  subjectId,
  sourceSemesterId,
  attemptType,
}) => {
  const [examSession, student, subject, sourceSemester] = await Promise.all([
    ensureExamSessionExists(examSessionId),
    ensureStudentExists(studentId),
    ensureSubjectExists(subjectId),
    ensureSemesterExists(sourceSemesterId),
  ]);

  if (!student.programId || !student.regulationId) {
    throw new ApiError(400, "Student academic mapping is incomplete");
  }

  const mapping = await CurriculumMapping.findOne({
    programId: student.programId,
    regulationId: student.regulationId,
    semesterId: sourceSemester._id,
    subjectId: subject._id,
    isActive: true,
  });

  if (!mapping) {
    throw new ApiError(
      400,
      "Subject is not mapped in curriculum for the student's program, regulation, and source semester",
    );
  }

  if (
    examSession.applicableRegulationIds.length > 0 &&
    !examSession.applicableRegulationIds.some(
      (id) => String(id) === String(student.regulationId),
    )
  ) {
    throw new ApiError(
      400,
      "Student regulation is not allowed in this exam session",
    );
  }

  if (
    examSession.applicableBatchIds.length > 0 &&
    !examSession.applicableBatchIds.some(
      (id) => String(id) === String(student.batchId),
    )
  ) {
    throw new ApiError(
      400,
      "Student batch is not allowed in this exam session",
    );
  }

  const studentCurrentSemester = await Semester.findById(
    student.currentSemesterId,
  );

  if (!studentCurrentSemester) {
    throw new ApiError(400, "Student current semester is invalid");
  }

  if (
    attemptType === ATTEMPT_TYPES.CURRENT &&
    String(studentCurrentSemester._id) !== String(sourceSemester._id)
  ) {
    throw new ApiError(
      400,
      "For CURRENT attempt, source semester must match the student's current semester",
    );
  }

  if (
    attemptType === ATTEMPT_TYPES.ARREAR &&
    sourceSemester.number >= studentCurrentSemester.number
  ) {
    throw new ApiError(
      400,
      "For ARREAR attempt, source semester must be lower than student's current semester",
    );
  }
};

const buildStudentFilter = ({ programId, batchId, studentSearch }) => {
  const filter = { academicStatus: "ACTIVE" };

  if (programId) {
    ensureValidObjectId(programId, "program");
    filter.programId = programId;
  }

  if (batchId) {
    ensureValidObjectId(batchId, "batch");
    filter.batchId = batchId;
  }

  if (studentSearch?.trim()) {
    const value = studentSearch.trim();
    filter.$or = [
      { registerNumber: { $regex: value, $options: "i" } },
      { fullName: { $regex: value, $options: "i" } },
    ];
  }

  return filter;
};

export const createExamRegistrationService = async (payload) => {
  await validateExamRegistrationBusinessRules(payload);

  const existingRegistration = await ExamRegistration.findOne({
    examSessionId: payload.examSessionId,
    studentId: payload.studentId,
    subjectId: payload.subjectId,
  });

  if (existingRegistration) {
    throw new ApiError(
      409,
      "Exam registration already exists for this student, exam session, and subject",
    );
  }

  const examRegistration = await ExamRegistration.create({
    examSessionId: payload.examSessionId,
    studentId: payload.studentId,
    subjectId: payload.subjectId,
    sourceSemesterId: payload.sourceSemesterId,
    attemptType: payload.attemptType,
    attemptNumber: payload.attemptNumber || 1,
    registrationStatus: payload.registrationStatus || "REGISTERED",
    isEligible: payload.isEligible ?? true,
    remarks: payload.remarks?.trim() || "",
  });

  return populateExamRegistration(
    ExamRegistration.findById(examRegistration._id),
  );
};

export const autoSyncCurrentExamRegistrationsService = async ({
  examSessionId,
  scopeType = "SPECIFIC",
  programId,
  batchId,
}) => {
  ensureValidObjectId(examSessionId, "exam session");

  if (scopeType === "SPECIFIC") {
    ensureValidObjectId(programId, "program");
    ensureValidObjectId(batchId, "batch");
  }

  const examSession = await ensureExamSessionExists(examSessionId);

  if (String(examSession.sessionCategory).toUpperCase() !== "REGULAR") {
    throw new ApiError(
      400,
      "Auto current sync is allowed only for REGULAR exam sessions",
    );
  }

  const studentFilter = { academicStatus: "ACTIVE" };
  if (scopeType === "SPECIFIC") {
    studentFilter.programId = programId;
    studentFilter.batchId = batchId;
  }

  const students = await Student.find(studentFilter);

  const summary = {
    examSessionId,
    scopeType,
    programId: scopeType === "SPECIFIC" ? programId : null,
    batchId: scopeType === "SPECIFIC" ? batchId : null,
    totalStudents: students.length,
    currentRegistrationsCreated: 0,
    duplicatesSkipped: 0,
    skippedStudents: [],
  };

  for (const student of students) {
    try {
      if (!student.currentSemesterId) {
        summary.skippedStudents.push({
          studentId: student._id,
          registerNumber: student.registerNumber,
          reason: "Student current semester is missing",
        });
        continue;
      }

      if (!student.regulationId) {
        summary.skippedStudents.push({
          studentId: student._id,
          registerNumber: student.registerNumber,
          reason: "Student regulation is missing",
        });
        continue;
      }

      if (!student.programId || !student.batchId) {
        summary.skippedStudents.push({
          studentId: student._id,
          registerNumber: student.registerNumber,
          reason: "Student program or batch is missing",
        });
        continue;
      }

      if (
        examSession.applicableRegulationIds.length > 0 &&
        !examSession.applicableRegulationIds.some(
          (id) => String(id) === String(student.regulationId),
        )
      ) {
        summary.skippedStudents.push({
          studentId: student._id,
          registerNumber: student.registerNumber,
          reason: "Student regulation is not allowed in this exam session",
        });
        continue;
      }

      if (
        examSession.applicableBatchIds.length > 0 &&
        !examSession.applicableBatchIds.some(
          (id) => String(id) === String(student.batchId),
        )
      ) {
        summary.skippedStudents.push({
          studentId: student._id,
          registerNumber: student.registerNumber,
          reason: "Student batch is not allowed in this exam session",
        });
        continue;
      }

      const mappings = await CurriculumMapping.find({
        programId: student.programId,
        regulationId: student.regulationId,
        semesterId: student.currentSemesterId,
        isActive: true,
      }).populate("subjectId", "code name isActive");

      for (const mapping of mappings) {
        if (!mapping.subjectId || mapping.subjectId.isActive === false) {
          continue;
        }

        const existingRegistration = await ExamRegistration.findOne({
          examSessionId,
          studentId: student._id,
          subjectId: mapping.subjectId._id,
        });

        if (existingRegistration) {
          summary.duplicatesSkipped += 1;
          continue;
        }

        await ExamRegistration.create({
          examSessionId,
          studentId: student._id,
          subjectId: mapping.subjectId._id,
          sourceSemesterId: student.currentSemesterId,
          attemptType: ATTEMPT_TYPES.CURRENT,
          attemptNumber: 1,
          registrationStatus: "REGISTERED",
          isEligible: true,
          remarks: "",
        });

        summary.currentRegistrationsCreated += 1;
      }
    } catch (error) {
      summary.skippedStudents.push({
        studentId: student._id,
        registerNumber: student.registerNumber,
        reason: error.message,
      });
    }
  }

  return summary;
};

export const getArrearCandidatesService = async ({
  examSessionId,
  programId,
  batchId,
  studentSearch,
}) => {
  ensureValidObjectId(examSessionId, "exam session");
  const examSession = await ensureExamSessionExists(examSessionId);

  const students = await Student.find(
    buildStudentFilter({ programId, batchId, studentSearch }),
  ).populate("currentSemesterId", "number label");

  const studentIds = students.map((student) => student._id);

  if (studentIds.length === 0) return [];

  const processedResults = await ProcessedResult.find({
    studentId: { $in: studentIds },
    isPublished: true,
    passStatus: { $ne: PASS_STATUSES.PASS },
  })
    .populate("studentId", "registerNumber fullName currentSemesterId")
    .populate("subjectId", "code name shortName subjectType credits isActive")
    .populate("sourceSemesterId", "number label displayOrder");

  const existingArrearRegistrations = await ExamRegistration.find({
    examSessionId,
    attemptType: ATTEMPT_TYPES.ARREAR,
    studentId: { $in: studentIds },
  });

  const existingKeySet = new Set(
    existingArrearRegistrations.map(
      (item) =>
        `${String(item.studentId)}__${String(item.subjectId)}__${String(item.sourceSemesterId)}`,
    ),
  );

  const groupedByStudent = new Map();

  for (const result of processedResults) {
    const student = result.studentId;
    const subject = result.subjectId;
    const sourceSemester = result.sourceSemesterId;

    if (!student || !subject || !sourceSemester) continue;
    if (subject.isActive === false) continue;

    const currentSemesterNumber =
      Number(student?.currentSemesterId?.number) ||
      Number(
        students.find((s) => String(s._id) === String(student._id))
          ?.currentSemesterId?.number || 0,
      );

    if (sourceSemester.number >= currentSemesterNumber) {
      continue;
    }

    const existingKey = `${String(student._id)}__${String(subject._id)}__${String(sourceSemester._id)}`;
    if (existingKeySet.has(existingKey)) {
      continue;
    }

    const bucket = groupedByStudent.get(String(student._id)) || {
      studentId: student._id,
      registerNumber: student.registerNumber,
      fullName: student.fullName,
      currentSemesterLabel:
        student?.currentSemesterId?.label ||
        students.find((s) => String(s._id) === String(student._id))
          ?.currentSemesterId?.label ||
        "-",
      arrearSubjects: [],
    };

    bucket.arrearSubjects.push({
      processedResultId: result._id,
      subjectId: subject._id,
      subjectCode: subject.code,
      subjectName: subject.name,
      sourceSemesterId: sourceSemester._id,
      sourceSemesterLabel: sourceSemester.label,
      passStatus: result.passStatus,
      previousAttemptType: result.attemptType,
      nextAttemptNumber: Number(result.attemptNumber || 1) + 1,
    });

    groupedByStudent.set(String(student._id), bucket);
  }

  return Array.from(groupedByStudent.values()).filter(
    (item) => item.arrearSubjects.length > 0,
  );
};

export const registerArrearCandidatesService = async ({
  examSessionId,
  registrations,
}) => {
  const examSession = await ensureExamSessionExists(examSessionId);

  if (String(examSession.sessionCategory).toUpperCase() !== "REGULAR") {
    throw new ApiError(
      400,
      "Arrear registration is allowed only for REGULAR exam sessions",
    );
  }

  const summary = {
    examSessionId,
    createdCount: 0,
    duplicatesSkipped: 0,
    failedRows: [],
  };

  for (const item of registrations) {
    try {
      const payload = {
        examSessionId,
        studentId: item.studentId,
        subjectId: item.subjectId,
        sourceSemesterId: item.sourceSemesterId,
        attemptType: ATTEMPT_TYPES.ARREAR,
        attemptNumber: item.attemptNumber || 2,
        registrationStatus: "REGISTERED",
        isEligible: true,
        remarks: "",
      };

      const existing = await ExamRegistration.findOne({
        examSessionId,
        studentId: payload.studentId,
        subjectId: payload.subjectId,
      });

      if (existing) {
        summary.duplicatesSkipped += 1;
        continue;
      }

      await validateExamRegistrationBusinessRules(payload);
      await ExamRegistration.create(payload);
      summary.createdCount += 1;
    } catch (error) {
      summary.failedRows.push({
        studentId: item.studentId,
        subjectId: item.subjectId,
        reason: error.message,
      });
    }
  }

  return summary;
};

export const getAllExamRegistrationsService = async () => {
  return populateExamRegistration(
    ExamRegistration.find().sort({ createdAt: -1 }),
  );
};

export const getExamRegistrationByIdService = async (examRegistrationId) => {
  ensureValidObjectId(examRegistrationId, "exam registration");

  const examRegistration = await populateExamRegistration(
    ExamRegistration.findById(examRegistrationId),
  );

  if (!examRegistration) {
    throw new ApiError(404, "Exam registration not found");
  }

  return examRegistration;
};

export const updateExamRegistrationService = async (
  examRegistrationId,
  payload,
) => {
  ensureValidObjectId(examRegistrationId, "exam registration");

  const examRegistration = await ExamRegistration.findById(examRegistrationId);

  if (!examRegistration) {
    throw new ApiError(404, "Exam registration not found");
  }

  const updatedValues = {
    examSessionId:
      payload.examSessionId ?? String(examRegistration.examSessionId),
    studentId: payload.studentId ?? String(examRegistration.studentId),
    subjectId: payload.subjectId ?? String(examRegistration.subjectId),
    sourceSemesterId:
      payload.sourceSemesterId ?? String(examRegistration.sourceSemesterId),
    attemptType: payload.attemptType ?? examRegistration.attemptType,
    attemptNumber: payload.attemptNumber ?? examRegistration.attemptNumber,
    registrationStatus:
      payload.registrationStatus ?? examRegistration.registrationStatus,
    isEligible: payload.isEligible ?? examRegistration.isEligible,
    remarks: payload.remarks ?? examRegistration.remarks,
  };

  await validateExamRegistrationBusinessRules(updatedValues);

  const duplicateRegistration = await ExamRegistration.findOne({
    examSessionId: updatedValues.examSessionId,
    studentId: updatedValues.studentId,
    subjectId: updatedValues.subjectId,
    _id: { $ne: examRegistrationId },
  });

  if (duplicateRegistration) {
    throw new ApiError(
      409,
      "Another exam registration already exists for this student, exam session, and subject",
    );
  }

  examRegistration.examSessionId = updatedValues.examSessionId;
  examRegistration.studentId = updatedValues.studentId;
  examRegistration.subjectId = updatedValues.subjectId;
  examRegistration.sourceSemesterId = updatedValues.sourceSemesterId;
  examRegistration.attemptType = updatedValues.attemptType;
  examRegistration.attemptNumber = updatedValues.attemptNumber;
  examRegistration.registrationStatus = updatedValues.registrationStatus;
  examRegistration.isEligible = updatedValues.isEligible;
  examRegistration.remarks = updatedValues.remarks?.trim() || "";

  await examRegistration.save();

  return populateExamRegistration(
    ExamRegistration.findById(examRegistration._id),
  );
};

export const toggleExamRegistrationEligibilityService = async (
  examRegistrationId,
) => {
  ensureValidObjectId(examRegistrationId, "exam registration");

  const examRegistration = await ExamRegistration.findById(examRegistrationId);

  if (!examRegistration) {
    throw new ApiError(404, "Exam registration not found");
  }

  examRegistration.isEligible = !examRegistration.isEligible;
  await examRegistration.save();

  return populateExamRegistration(
    ExamRegistration.findById(examRegistration._id),
  );
};
