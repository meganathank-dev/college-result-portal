import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  createExamSessionService,
  getAllExamSessionsService,
  getExamSessionByIdService,
  updateExamSessionService,
  toggleExamSessionStatusService
} from "./examSession.service.js";

export const createExamSession = asyncHandler(async (req, res) => {
  const examSession = await createExamSessionService(req.body);

  return res.status(201).json(
    new ApiResponse(201, "Exam session created successfully", examSession)
  );
});

export const getAllExamSessions = asyncHandler(async (_req, res) => {
  const examSessions = await getAllExamSessionsService();

  return res.status(200).json(
    new ApiResponse(200, "Exam sessions fetched successfully", examSessions)
  );
});

export const getExamSessionById = asyncHandler(async (req, res) => {
  const examSession = await getExamSessionByIdService(req.params.examSessionId);

  return res.status(200).json(
    new ApiResponse(200, "Exam session fetched successfully", examSession)
  );
});

export const updateExamSession = asyncHandler(async (req, res) => {
  const examSession = await updateExamSessionService(req.params.examSessionId, req.body);

  return res.status(200).json(
    new ApiResponse(200, "Exam session updated successfully", examSession)
  );
});

export const toggleExamSessionStatus = asyncHandler(async (req, res) => {
  const examSession = await toggleExamSessionStatusService(req.params.examSessionId);

  return res.status(200).json(
    new ApiResponse(
      200,
      `Exam session status changed to ${examSession.status}`,
      examSession
    )
  );
});