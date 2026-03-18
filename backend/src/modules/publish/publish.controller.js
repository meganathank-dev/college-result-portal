import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  publishExamSessionService,
  getAllPublishSnapshotsService,
  getPublishSnapshotByIdService
} from "./publish.service.js";

export const publishExamSession = asyncHandler(async (req, res) => {
  const snapshot = await publishExamSessionService({
    examSessionId: req.body.examSessionId,
    notes: req.body.notes || "",
    actorUserId: req.user.userId
  });

  return res.status(200).json(
    new ApiResponse(200, "Exam session results published successfully", snapshot)
  );
});

export const getAllPublishSnapshots = asyncHandler(async (_req, res) => {
  const snapshots = await getAllPublishSnapshotsService();

  return res.status(200).json(
    new ApiResponse(200, "Publish snapshots fetched successfully", snapshots)
  );
});

export const getPublishSnapshotById = asyncHandler(async (req, res) => {
  const snapshot = await getPublishSnapshotByIdService(req.params.publishSnapshotId);

  return res.status(200).json(
    new ApiResponse(200, "Publish snapshot fetched successfully", snapshot)
  );
});