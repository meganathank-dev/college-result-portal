import mongoose from "mongoose";
import { PublishSnapshot } from "./publishSnapshot.model.js";
import { ExamSession } from "../exam-sessions/examSession.model.js";
import { ProcessedResult } from "../results/processedResult.model.js";
import { SemesterSummary } from "../results/semesterSummary.model.js";
import { User } from "../users/user.model.js";
import { ApiError } from "../../utils/apiError.js";
import { PUBLISH_SNAPSHOT_STATUSES, EXAM_SESSION_STATUSES } from "../../config/constants.js";

const ensureValidObjectId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${label} ID`);
  }
};

const ensureExamSessionExists = async (examSessionId) => {
  ensureValidObjectId(examSessionId, "exam session");
  const examSession = await ExamSession.findById(examSessionId);
  if (!examSession) {
    throw new ApiError(404, "Exam session not found");
  }
  return examSession;
};

const ensureUserExists = async (userId) => {
  ensureValidObjectId(userId, "user");
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

const populatePublishSnapshot = (query) =>
  query
    .populate("examSessionId", "name examMonth examYear sessionCategory status")
    .populate("publishedBy", "fullName email role");

export const publishExamSessionService = async ({ examSessionId, notes = "", actorUserId }) => {
  const [examSession] = await Promise.all([
    ensureExamSessionExists(examSessionId),
    ensureUserExists(actorUserId)
  ]);

  const processedResults = await ProcessedResult.find({ examSessionId });
  if (processedResults.length === 0) {
    throw new ApiError(400, "No processed results found for this exam session");
  }

  const semesterSummaries = await SemesterSummary.find({ examSessionId });
  if (semesterSummaries.length === 0) {
    throw new ApiError(400, "No semester summaries found for this exam session");
  }

  const latestSnapshot = await PublishSnapshot.findOne({ examSessionId })
    .sort({ snapshotVersion: -1 });

  const nextSnapshotVersion = latestSnapshot ? latestSnapshot.snapshotVersion + 1 : 1;

  await PublishSnapshot.updateMany(
    { examSessionId, status: PUBLISH_SNAPSHOT_STATUSES.ACTIVE },
    { $set: { status: PUBLISH_SNAPSHOT_STATUSES.SUPERSEDED } }
  );

  await ProcessedResult.updateMany(
    { examSessionId },
    { $set: { isPublished: true } }
  );

  await SemesterSummary.updateMany(
    { examSessionId },
    { $set: { isPublished: true } }
  );

  examSession.status = EXAM_SESSION_STATUSES.PUBLISHED;
  examSession.resultPublishedAt = new Date();
  examSession.resultPublishedBy = actorUserId;
  await examSession.save();

  const uniqueStudents = new Set(processedResults.map((item) => String(item.studentId)));

  const snapshot = await PublishSnapshot.create({
    examSessionId,
    snapshotVersion: nextSnapshotVersion,
    publishedBy: actorUserId,
    publishedAt: new Date(),
    totalStudents: uniqueStudents.size,
    totalSubjects: processedResults.length,
    status: PUBLISH_SNAPSHOT_STATUSES.ACTIVE,
    notes: notes.trim()
  });

  return populatePublishSnapshot(PublishSnapshot.findById(snapshot._id));
};

export const getAllPublishSnapshotsService = async () => {
  return populatePublishSnapshot(
    PublishSnapshot.find().sort({ createdAt: -1 })
  );
};

export const getPublishSnapshotByIdService = async (publishSnapshotId) => {
  ensureValidObjectId(publishSnapshotId, "publish snapshot");

  const snapshot = await populatePublishSnapshot(
    PublishSnapshot.findById(publishSnapshotId)
  );

  if (!snapshot) {
    throw new ApiError(404, "Publish snapshot not found");
  }

  return snapshot;
};