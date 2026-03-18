import { Student } from "../students/student.model.js";
import { ProcessedResult } from "../results/processedResult.model.js";
import { SemesterSummary } from "../results/semesterSummary.model.js";
import { PublishSnapshot } from "../publish/publishSnapshot.model.js";
import { ApiError } from "../../utils/apiError.js";
import { PASS_STATUSES } from "../../config/constants.js";

const normalizeDateOnly = (dateValue) => {
  const d = new Date(dateValue);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
};

const sameDateOnly = (a, b) => {
  const d1 = normalizeDateOnly(a);
  const d2 = normalizeDateOnly(b);
  return d1.getTime() === d2.getTime();
};

const buildStudentProfile = (student) => ({
  registerNumber: student.registerNumber,
  fullName: student.fullName,
  department: student.departmentId
    ? {
        code: student.departmentId.code,
        name: student.departmentId.name,
        shortName: student.departmentId.shortName,
      }
    : null,
  program: student.programId
    ? {
        code: student.programId.code,
        name: student.programId.name,
        degreeType: student.programId.degreeType,
      }
    : null,
  regulation: student.regulationId
    ? {
        code: student.regulationId.code,
        name: student.regulationId.name,
      }
    : null,
  batch: student.batchId
    ? {
        label: student.batchId.label,
        startYear: student.batchId.startYear,
        endYear: student.batchId.endYear,
      }
    : null,
  currentSemester: student.currentSemesterId
    ? {
        number: student.currentSemesterId.number,
        label: student.currentSemesterId.label,
      }
    : null,
});

const buildSubjectResultView = (processedResult) => ({
  subjectCode: processedResult.subjectId?.code || "",
  subjectName: processedResult.subjectId?.name || "",
  shortName: processedResult.subjectId?.shortName || "",
  subjectType: processedResult.subjectId?.subjectType || "",
  credits: processedResult.subjectId?.credits || 0,
  sourceSemester: processedResult.sourceSemesterId
    ? {
        number: processedResult.sourceSemesterId.number,
        label: processedResult.sourceSemesterId.label,
      }
    : null,
  attemptType: processedResult.attemptType,
  attemptNumber: processedResult.attemptNumber,
  result: processedResult.passStatus,
  grade: processedResult.grade,
  gradePoint: processedResult.gradePoint,
  creditsEarned: processedResult.creditsEarned,
});

const buildSemesterSummaryView = (summary) => ({
  semester: summary.semesterId
    ? {
        number: summary.semesterId.number,
        label: summary.semesterId.label,
      }
    : null,
  gpa: summary.gpa,
  cgpa: summary.cgpa,
  totalRegisteredSubjects: summary.totalRegisteredSubjects,
  totalPassedSubjects: summary.totalPassedSubjects,
  totalFailedSubjects: summary.totalFailedSubjects,
  totalRegisteredCredits: summary.totalRegisteredCredits,
  totalEarnedCredits: summary.totalEarnedCredits,
  currentArrearCount: summary.currentArrearCount,
  totalPendingArrearCount: summary.totalPendingArrearCount,
  totalClearedArrearCount: summary.totalClearedArrearCount,
});

const buildArrearSummary = (allPublishedProcessedResults) => {
  const pending = allPublishedProcessedResults.filter(
    (item) => item.passStatus !== PASS_STATUSES.PASS,
  ).length;

  const cleared = allPublishedProcessedResults.filter(
    (item) =>
      item.attemptType === "ARREAR" && item.passStatus === PASS_STATUSES.PASS,
  ).length;

  return {
    totalPendingArrears: pending,
    totalClearedArrears: cleared,
  };
};

const getValidatedStudent = async ({ registerNumber, dob }) => {
  const student = await Student.findOne({
    registerNumber: registerNumber.trim().toUpperCase(),
  })
    .populate("departmentId", "code name shortName")
    .populate("programId", "code name degreeType")
    .populate("regulationId", "code name")
    .populate("batchId", "label startYear endYear")
    .populate("currentSemesterId", "number label");

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (!sameDateOnly(student.dob, dob)) {
    throw new ApiError(401, "Invalid register number or date of birth");
  }

  return student;
};

export const searchPublishedResultService = async ({ registerNumber, dob }) => {
  const student = await getValidatedStudent({ registerNumber, dob });

  const activeSnapshots = await PublishSnapshot.find({
    status: "ACTIVE",
  }).sort({ publishedAt: -1 });

  const publishedExamSessionIds = activeSnapshots.map(
    (item) => item.examSessionId,
  );

  if (publishedExamSessionIds.length === 0) {
    throw new ApiError(404, "No published results found");
  }

  const latestPublishedResult = await ProcessedResult.findOne({
    studentId: student._id,
    examSessionId: { $in: publishedExamSessionIds },
    isPublished: true,
  })
    .sort({ processedAt: -1 })
    .populate("examSessionId", "name examMonth examYear sessionCategory status")
    .populate("subjectId", "code name shortName subjectType credits")
    .populate("sourceSemesterId", "number label");

  if (!latestPublishedResult) {
    throw new ApiError(404, "No published result found for this student");
  }

  const targetExamSessionId = latestPublishedResult.examSessionId._id;

  const rawSubjectResults = await ProcessedResult.find({
    studentId: student._id,
    examSessionId: targetExamSessionId,
    isPublished: true,
  })
    .populate("subjectId", "code name shortName subjectType credits")
    .populate("sourceSemesterId", "number label")
    .sort({ createdAt: -1 });

  const uniqueSubjectResultsMap = new Map();

  for (const item of rawSubjectResults) {
    const key = String(item?.subjectId?._id || item?.subjectId || "");

    if (!uniqueSubjectResultsMap.has(key)) {
      uniqueSubjectResultsMap.set(key, item);
    }
  }

  const subjectResults = Array.from(uniqueSubjectResultsMap.values()).sort(
    (a, b) => {
      const semA = Number(a?.sourceSemesterId?.number || 0);
      const semB = Number(b?.sourceSemesterId?.number || 0);

      if (semA !== semB) return semA - semB;

      const codeA = String(a?.subjectId?.code || "");
      const codeB = String(b?.subjectId?.code || "");

      return codeA.localeCompare(codeB);
    },
  );

  const semesterSummary = await SemesterSummary.findOne({
    studentId: student._id,
    examSessionId: targetExamSessionId,
    isPublished: true,
  }).populate("semesterId", "number label");

  const allPublishedProcessedResults = await ProcessedResult.find({
    studentId: student._id,
    isPublished: true,
  });

  return {
    student: buildStudentProfile(student),
    examSession: {
      _id: latestPublishedResult.examSessionId._id,
      name: latestPublishedResult.examSessionId.name,
      examMonth: latestPublishedResult.examSessionId.examMonth,
      examYear: latestPublishedResult.examSessionId.examYear,
      sessionCategory: latestPublishedResult.examSessionId.sessionCategory,
    },
    subjectResults: subjectResults.map(buildSubjectResultView),
    summary: semesterSummary ? buildSemesterSummaryView(semesterSummary) : null,
    arrearSummary: buildArrearSummary(allPublishedProcessedResults),
  };
};

export const getPublishedResultHistoryService = async ({
  registerNumber,
  dob,
}) => {
  const student = await getValidatedStudent({ registerNumber, dob });

  const summaries = await SemesterSummary.find({
    studentId: student._id,
    isPublished: true,
  })
    .populate("examSessionId", "name examMonth examYear sessionCategory status")
    .populate("semesterId", "number label displayOrder")
    .sort({ createdAt: -1 });

  if (summaries.length === 0) {
    throw new ApiError(
      404,
      "No published result history found for this student",
    );
  }

  const history = summaries.map((item) => ({
    examSession: item.examSessionId
      ? {
          _id: item.examSessionId._id,
          name: item.examSessionId.name,
          examMonth: item.examSessionId.examMonth,
          examYear: item.examSessionId.examYear,
          sessionCategory: item.examSessionId.sessionCategory,
        }
      : null,
    summary: buildSemesterSummaryView(item),
  }));

  const allPublishedProcessedResults = await ProcessedResult.find({
    studentId: student._id,
    isPublished: true,
  });

  return {
    student: buildStudentProfile(student),
    history,
    arrearSummary: buildArrearSummary(allPublishedProcessedResults),
  };
};

export const getPublishedResultForPdfService = async ({
  registerNumber,
  dob,
}) => {
  return searchPublishedResultService({ registerNumber, dob });
};
