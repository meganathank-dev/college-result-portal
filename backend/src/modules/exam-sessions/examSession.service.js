import mongoose from "mongoose";
import { ExamSession } from "./examSession.model.js";
import { Regulation } from "../regulations/regulation.model.js";
import { Batch } from "../batches/batch.model.js";
import { User } from "../users/user.model.js";
import { ApiError } from "../../utils/apiError.js";

const ensureValidObjectId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${label} ID`);
  }
};

const ensureRegulationsExist = async (ids = []) => {
  for (const id of ids) {
    ensureValidObjectId(id, "regulation");
  }

  if (ids.length === 0) return;

  const count = await Regulation.countDocuments({ _id: { $in: ids } });
  if (count !== ids.length) {
    throw new ApiError(404, "One or more regulations not found");
  }
};

const ensureBatchesExist = async (ids = []) => {
  for (const id of ids) {
    ensureValidObjectId(id, "batch");
  }

  if (ids.length === 0) return;

  const count = await Batch.countDocuments({ _id: { $in: ids } });
  if (count !== ids.length) {
    throw new ApiError(404, "One or more batches not found");
  }
};

const ensureUserExistsIfProvided = async (userId) => {
  if (!userId) return;

  ensureValidObjectId(userId, "user");

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "Published by user not found");
  }
};

const ensureParentExamSessionExistsIfProvided = async (parentExamSessionId, examSessionIdToExclude = null) => {
  if (!parentExamSessionId) return null;

  ensureValidObjectId(parentExamSessionId, "parent exam session");

  if (
    examSessionIdToExclude &&
    String(parentExamSessionId) === String(examSessionIdToExclude)
  ) {
    throw new ApiError(400, "Exam session cannot be its own parent");
  }

  const parent = await ExamSession.findById(parentExamSessionId);

  if (!parent) {
    throw new ApiError(404, "Parent exam session not found");
  }

  return parent;
};

const validateSessionBusinessRules = async ({
  sessionCategory,
  examMonth,
  parentExamSessionId,
  examSessionIdToExclude = null
}) => {
  if (sessionCategory === "REGULAR" && !examMonth) {
    throw new ApiError(400, "Exam month is required for REGULAR sessions");
  }

  if (sessionCategory === "REVALUATION" && !parentExamSessionId) {
    throw new ApiError(400, "Parent exam session is required for REVALUATION sessions");
  }

  if (sessionCategory === "REVALUATION") {
    const parent = await ensureParentExamSessionExistsIfProvided(
      parentExamSessionId,
      examSessionIdToExclude
    );

    if (parent && parent.sessionCategory === "REVALUATION") {
      throw new ApiError(400, "Revaluation session cannot use another revaluation session as parent");
    }
  }
};

const populateExamSession = (query) =>
  query
    .populate("parentExamSessionId", "name examMonth examYear sessionCategory status")
    .populate("applicableRegulationIds", "code name effectiveFromBatchYear effectiveToBatchYear isActive")
    .populate("applicableBatchIds", "label startYear endYear isActive")
    .populate("resultPublishedBy", "fullName email role");

export const createExamSessionService = async (payload) => {
  await Promise.all([
    ensureRegulationsExist(payload.applicableRegulationIds || []),
    ensureBatchesExist(payload.applicableBatchIds || []),
    validateSessionBusinessRules({
      sessionCategory: payload.sessionCategory,
      examMonth: payload.examMonth,
      parentExamSessionId: payload.parentExamSessionId
    })
  ]);

  const examSession = await ExamSession.create({
    name: payload.name.trim(),
    examMonth: payload.examMonth ? payload.examMonth.trim().toUpperCase() : null,
    examYear: payload.examYear,
    sessionCategory: payload.sessionCategory,
    parentExamSessionId: payload.parentExamSessionId || null,
    status: "DRAFT",
    applicableRegulationIds: payload.applicableRegulationIds || [],
    applicableBatchIds: payload.applicableBatchIds || [],
    notes: payload.notes?.trim() || ""
  });

  return populateExamSession(ExamSession.findById(examSession._id));
};

export const getAllExamSessionsService = async () => {
  return populateExamSession(
    ExamSession.find().sort({ createdAt: -1 })
  );
};

export const getExamSessionByIdService = async (examSessionId) => {
  ensureValidObjectId(examSessionId, "exam session");

  const examSession = await populateExamSession(
    ExamSession.findById(examSessionId)
  );

  if (!examSession) {
    throw new ApiError(404, "Exam session not found");
  }

  return examSession;
};

export const updateExamSessionService = async (examSessionId, payload) => {
  ensureValidObjectId(examSessionId, "exam session");

  const examSession = await ExamSession.findById(examSessionId);

  if (!examSession) {
    throw new ApiError(404, "Exam session not found");
  }

  const updatedRegulationIds =
    payload.applicableRegulationIds !== undefined
      ? payload.applicableRegulationIds
      : examSession.applicableRegulationIds.map(String);

  const updatedBatchIds =
    payload.applicableBatchIds !== undefined
      ? payload.applicableBatchIds
      : examSession.applicableBatchIds.map(String);

  const updatedSessionCategory =
    payload.sessionCategory !== undefined
      ? payload.sessionCategory
      : examSession.sessionCategory;

  const updatedExamMonth =
    payload.examMonth !== undefined
      ? payload.examMonth
      : examSession.examMonth;

  const updatedParentExamSessionId =
    payload.parentExamSessionId !== undefined
      ? payload.parentExamSessionId
      : (examSession.parentExamSessionId ? String(examSession.parentExamSessionId) : null);

  await Promise.all([
    ensureRegulationsExist(updatedRegulationIds),
    ensureBatchesExist(updatedBatchIds),
    ensureUserExistsIfProvided(payload.resultPublishedBy),
    validateSessionBusinessRules({
      sessionCategory: updatedSessionCategory,
      examMonth: updatedExamMonth,
      parentExamSessionId: updatedParentExamSessionId,
      examSessionIdToExclude: examSessionId
    })
  ]);

  if (payload.name !== undefined) {
    examSession.name = payload.name.trim();
  }

  if (payload.examMonth !== undefined) {
    examSession.examMonth = payload.examMonth
      ? payload.examMonth.trim().toUpperCase()
      : null;
  }

  if (payload.examYear !== undefined) {
    examSession.examYear = payload.examYear;
  }

  if (payload.sessionCategory !== undefined) {
    examSession.sessionCategory = payload.sessionCategory;
  }

  if (payload.parentExamSessionId !== undefined) {
    examSession.parentExamSessionId = payload.parentExamSessionId || null;
  }

  if (payload.status !== undefined) {
    examSession.status = payload.status;
  }

  if (payload.applicableRegulationIds !== undefined) {
    examSession.applicableRegulationIds = payload.applicableRegulationIds;
  }

  if (payload.applicableBatchIds !== undefined) {
    examSession.applicableBatchIds = payload.applicableBatchIds;
  }

  if (payload.notes !== undefined) {
    examSession.notes = payload.notes?.trim() || "";
  }

  if (payload.resultPublishedAt !== undefined) {
    examSession.resultPublishedAt = payload.resultPublishedAt
      ? new Date(payload.resultPublishedAt)
      : null;
  }

  if (payload.resultPublishedBy !== undefined) {
    examSession.resultPublishedBy = payload.resultPublishedBy || null;
  }

  await examSession.save();

  return populateExamSession(ExamSession.findById(examSession._id));
};

export const toggleExamSessionStatusService = async (examSessionId) => {
  ensureValidObjectId(examSessionId, "exam session");

  const examSession = await ExamSession.findById(examSessionId);

  if (!examSession) {
    throw new ApiError(404, "Exam session not found");
  }

  examSession.status = examSession.status === "DRAFT" ? "OPEN" : "DRAFT";
  await examSession.save();

  return populateExamSession(ExamSession.findById(examSession._id));
};