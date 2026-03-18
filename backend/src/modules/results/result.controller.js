import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  processSingleResultService,
  processExamSessionResultsService,
  getAllProcessedResultsService,
  getProcessedResultByIdService,
  getAllSemesterSummariesService,
  getSemesterSummaryByIdService
} from "./result.service.js";

export const processSingleResult = asyncHandler(async (req, res) => {
  const result = await processSingleResultService(req.body.markEntryId);

  return res.status(200).json(
    new ApiResponse(200, "Single result processed successfully", result)
  );
});

export const processExamSessionResults = asyncHandler(async (req, res) => {
  const results = await processExamSessionResultsService(req.body.examSessionId);

  return res.status(200).json(
    new ApiResponse(200, "Exam session results processed successfully", results)
  );
});

export const getAllProcessedResults = asyncHandler(async (_req, res) => {
  const results = await getAllProcessedResultsService();

  return res.status(200).json(
    new ApiResponse(200, "Processed results fetched successfully", results)
  );
});

export const getProcessedResultById = asyncHandler(async (req, res) => {
  const result = await getProcessedResultByIdService(req.params.processedResultId);

  return res.status(200).json(
    new ApiResponse(200, "Processed result fetched successfully", result)
  );
});

export const getAllSemesterSummaries = asyncHandler(async (_req, res) => {
  const summaries = await getAllSemesterSummariesService();

  return res.status(200).json(
    new ApiResponse(200, "Semester summaries fetched successfully", summaries)
  );
});

export const getSemesterSummaryById = asyncHandler(async (req, res) => {
  const summary = await getSemesterSummaryByIdService(req.params.semesterSummaryId);

  return res.status(200).json(
    new ApiResponse(200, "Semester summary fetched successfully", summary)
  );
});