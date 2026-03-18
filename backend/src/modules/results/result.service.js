import mongoose from "mongoose";
import { MarkEntry } from "../mark-entries/markEntry.model.js";
import { ExamRegistration } from "../exam-registrations/examRegistration.model.js";
import { Subject } from "../subjects/subject.model.js";
import { Student } from "../students/student.model.js";
import { GradingPolicy } from "../grading-policies/gradingPolicy.model.js";
import { ProcessedResult } from "./processedResult.model.js";
import { SemesterSummary } from "./semesterSummary.model.js";
import { ApiError } from "../../utils/apiError.js";
import { MARK_ENTRY_STATUSES, PASS_STATUSES } from "../../config/constants.js";
import { calculateGPA, calculateCGPA } from "./gpa.utils.js";

const ensureValidObjectId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${label} ID`);
  }
};

const populateProcessedResult = (query) =>
  query
    .populate("examSessionId", "name examMonth examYear sessionCategory status")
    .populate("examRegistrationId", "attemptType attemptNumber registrationStatus isEligible remarks")
    .populate("studentId", "registerNumber fullName academicStatus")
    .populate("subjectId", "code name shortName subjectType credits")
    .populate("sourceSemesterId", "number label displayOrder")
    .populate("gradingPolicyId", "subjectType internalMin externalMin totalMin gradeRules");

const populateSemesterSummary = (query) =>
  query
    .populate("studentId", "registerNumber fullName academicStatus")
    .populate("examSessionId", "name examMonth examYear sessionCategory status")
    .populate("semesterId", "number label displayOrder");

const findGradeRule = (gradeRules, totalMark) => {
  return gradeRules.find((rule) => totalMark >= rule.min && totalMark <= rule.max) || null;
};

const buildProcessedDecision = ({ markEntry, subject, gradingPolicy }) => {
  if (markEntry.isMalpractice) {
    return {
      passStatus: PASS_STATUSES.MALPRACTICE,
      grade: "U",
      gradePoint: 0,
      creditsEarned: 0
    };
  }

  if (markEntry.isWithheld) {
    return {
      passStatus: PASS_STATUSES.WITHHELD,
      grade: "U",
      gradePoint: 0,
      creditsEarned: 0
    };
  }

  if (markEntry.isAbsent) {
    return {
      passStatus: PASS_STATUSES.ABSENT,
      grade: "U",
      gradePoint: 0,
      creditsEarned: 0
    };
  }

  const internalPass = markEntry.internalMark >= gradingPolicy.internalMin;
  const externalPass = markEntry.externalMark >= gradingPolicy.externalMin;
  const totalPass = markEntry.totalMark >= gradingPolicy.totalMin;

  if (!(internalPass && externalPass && totalPass)) {
    return {
      passStatus: PASS_STATUSES.FAIL,
      grade: "U",
      gradePoint: 0,
      creditsEarned: 0
    };
  }

  const gradeRule = findGradeRule(gradingPolicy.gradeRules, markEntry.totalMark);

  if (!gradeRule) {
    throw new ApiError(400, `No grade rule found for total mark ${markEntry.totalMark}`);
  }

  return {
    passStatus: PASS_STATUSES.PASS,
    grade: gradeRule.grade,
    gradePoint: gradeRule.point,
    creditsEarned: subject.credits
  };
};

const upsertSemesterSummary = async ({ studentId, examSessionId, semesterId }) => {
  const semesterResults = await ProcessedResult.find({
    studentId,
    examSessionId,
    sourceSemesterId: semesterId
  }).populate("subjectId", "credits");

  const totalRegisteredSubjects = semesterResults.length;
  const totalPassedSubjects = semesterResults.filter((r) => r.passStatus === PASS_STATUSES.PASS).length;
  const totalFailedSubjects = semesterResults.filter((r) => r.passStatus !== PASS_STATUSES.PASS).length;

  const totalRegisteredCredits = semesterResults.reduce(
    (sum, r) => sum + Number(r.subjectId?.credits || 0),
    0
  );

  const totalEarnedCredits = semesterResults.reduce(
    (sum, r) => sum + Number(r.creditsEarned || 0),
    0
  );

  const gpa = calculateGPA(semesterResults);

  const allStudentProcessedResults = await ProcessedResult.find({ studentId });
  const cgpa = calculateCGPA(allStudentProcessedResults);

  const currentArrearCount = semesterResults.filter((r) => r.passStatus !== PASS_STATUSES.PASS).length;
  const totalPendingArrearCount = allStudentProcessedResults.filter((r) => r.passStatus !== PASS_STATUSES.PASS).length;
  const totalClearedArrearCount = allStudentProcessedResults.filter(
    (r) => r.attemptType === "ARREAR" && r.passStatus === PASS_STATUSES.PASS
  ).length;

  const existingSummary = await SemesterSummary.findOne({
    studentId,
    examSessionId
  });

  if (existingSummary) {
    existingSummary.totalRegisteredSubjects = totalRegisteredSubjects;
    existingSummary.totalPassedSubjects = totalPassedSubjects;
    existingSummary.totalFailedSubjects = totalFailedSubjects;
    existingSummary.totalRegisteredCredits = totalRegisteredCredits;
    existingSummary.totalEarnedCredits = totalEarnedCredits;
    existingSummary.gpa = gpa;
    existingSummary.cgpa = cgpa;
    existingSummary.currentArrearCount = currentArrearCount;
    existingSummary.totalPendingArrearCount = totalPendingArrearCount;
    existingSummary.totalClearedArrearCount = totalClearedArrearCount;
    existingSummary.resultVersion += 1;
    await existingSummary.save();
    return existingSummary;
  }

  return SemesterSummary.create({
    studentId,
    examSessionId,
    semesterId,
    totalRegisteredSubjects,
    totalPassedSubjects,
    totalFailedSubjects,
    totalRegisteredCredits,
    totalEarnedCredits,
    gpa,
    cgpa,
    currentArrearCount,
    totalPendingArrearCount,
    totalClearedArrearCount,
    resultVersion: 1,
    isPublished: false
  });
};

export const processSingleResultService = async (markEntryId) => {
  ensureValidObjectId(markEntryId, "mark entry");

  const markEntry = await MarkEntry.findById(markEntryId);

  if (!markEntry) {
    throw new ApiError(404, "Mark entry not found");
  }

  if (markEntry.entryStatus !== MARK_ENTRY_STATUSES.LOCKED) {
    throw new ApiError(400, "Only locked mark entries can be processed");
  }

  const [examRegistration, student, subject] = await Promise.all([
    ExamRegistration.findById(markEntry.examRegistrationId),
    Student.findById(markEntry.studentId),
    Subject.findById(markEntry.subjectId)
  ]);

  if (!examRegistration) throw new ApiError(404, "Exam registration not found");
  if (!student) throw new ApiError(404, "Student not found");
  if (!subject) throw new ApiError(404, "Subject not found");

  const gradingPolicy = await GradingPolicy.findOne({
    regulationId: student.regulationId,
    subjectType: subject.subjectType,
    isActive: true
  });

  if (!gradingPolicy) {
    throw new ApiError(404, "Active grading policy not found for student regulation and subject type");
  }

  const decision = buildProcessedDecision({
    markEntry,
    subject,
    gradingPolicy
  });

  const existingProcessedResult = await ProcessedResult.findOne({
    examRegistrationId: examRegistration._id
  });

  let processedResult;

  if (existingProcessedResult) {
    existingProcessedResult.internalMark = markEntry.internalMark;
    existingProcessedResult.externalMark = markEntry.externalMark;
    existingProcessedResult.totalMark = markEntry.totalMark;
    existingProcessedResult.passStatus = decision.passStatus;
    existingProcessedResult.grade = decision.grade;
    existingProcessedResult.gradePoint = decision.gradePoint;
    existingProcessedResult.creditsEarned = decision.creditsEarned;
    existingProcessedResult.gradingPolicyId = gradingPolicy._id;
    existingProcessedResult.resultVersion += 1;
    existingProcessedResult.processedAt = new Date();
    await existingProcessedResult.save();
    processedResult = existingProcessedResult;
  } else {
    processedResult = await ProcessedResult.create({
      examSessionId: markEntry.examSessionId,
      examRegistrationId: examRegistration._id,
      studentId: markEntry.studentId,
      subjectId: markEntry.subjectId,
      sourceSemesterId: examRegistration.sourceSemesterId,
      attemptType: examRegistration.attemptType,
      attemptNumber: examRegistration.attemptNumber,
      internalMark: markEntry.internalMark,
      externalMark: markEntry.externalMark,
      totalMark: markEntry.totalMark,
      passStatus: decision.passStatus,
      grade: decision.grade,
      gradePoint: decision.gradePoint,
      creditsEarned: decision.creditsEarned,
      gradingPolicyId: gradingPolicy._id,
      resultVersion: 1,
      isPublished: false,
      processedAt: new Date()
    });
  }

  await upsertSemesterSummary({
    studentId: markEntry.studentId,
    examSessionId: markEntry.examSessionId,
    semesterId: examRegistration.sourceSemesterId
  });

  return populateProcessedResult(ProcessedResult.findById(processedResult._id));
};

export const processExamSessionResultsService = async (examSessionId) => {
  ensureValidObjectId(examSessionId, "exam session");

  const lockedMarkEntries = await MarkEntry.find({
    examSessionId,
    entryStatus: MARK_ENTRY_STATUSES.LOCKED
  });

  if (lockedMarkEntries.length === 0) {
    throw new ApiError(400, "No locked mark entries found for this exam session");
  }

  const summary = {
    totalLockedEntries: lockedMarkEntries.length,
    processedCount: 0,
    skippedCount: 0,
    processedResults: [],
    skippedRows: []
  };

  for (const entry of lockedMarkEntries) {
    try {
      const examRegistration = await ExamRegistration.findById(entry.examRegistrationId);

      if (!examRegistration) {
        summary.skippedCount += 1;
        summary.skippedRows.push({
          markEntryId: entry._id,
          examRegistrationId: entry.examRegistrationId,
          reason: "Exam registration not found"
        });
        continue;
      }

      const processed = await processSingleResultService(String(entry._id));
      summary.processedCount += 1;
      summary.processedResults.push(processed);
    } catch (error) {
      summary.skippedCount += 1;
      summary.skippedRows.push({
        markEntryId: entry._id,
        examRegistrationId: entry.examRegistrationId,
        reason: error.message
      });
    }
  }

  return summary;
};

export const getAllProcessedResultsService = async () => {
  return populateProcessedResult(
    ProcessedResult.find().sort({ createdAt: -1 })
  );
};

export const getProcessedResultByIdService = async (processedResultId) => {
  ensureValidObjectId(processedResultId, "processed result");

  const processedResult = await populateProcessedResult(
    ProcessedResult.findById(processedResultId)
  );

  if (!processedResult) {
    throw new ApiError(404, "Processed result not found");
  }

  return processedResult;
};

export const getAllSemesterSummariesService = async () => {
  return populateSemesterSummary(
    SemesterSummary.find().sort({ createdAt: -1 })
  );
};

export const getSemesterSummaryByIdService = async (semesterSummaryId) => {
  ensureValidObjectId(semesterSummaryId, "semester summary");

  const semesterSummary = await populateSemesterSummary(
    SemesterSummary.findById(semesterSummaryId)
  );

  if (!semesterSummary) {
    throw new ApiError(404, "Semester summary not found");
  }

  return semesterSummary;
};