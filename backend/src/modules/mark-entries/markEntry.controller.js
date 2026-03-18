import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  bulkImportMarkEntriesService,
  bulkUpsertMarkEntriesService,
  createMarkEntryService,
  getAllMarkEntriesService,
  getMarkEntryByIdService,
  getMarkEntryCandidatesService,
  getMarkImportCandidatesService,
  getMarkImportSubjectsService,
  updateMarkEntryService,
  verifyMarkEntryService,
  lockMarkEntryService
} from "./markEntry.service.js";

export const createMarkEntry = asyncHandler(async (req, res) => {
  const markEntry = await createMarkEntryService(req.body, req.user.userId);

  return res.status(201).json(
    new ApiResponse(201, "Mark entry created successfully", markEntry)
  );
});

export const getMarkEntryCandidates = asyncHandler(async (req, res) => {
  const candidates = await getMarkEntryCandidatesService(req.query);

  return res.status(200).json(
    new ApiResponse(200, "Mark entry candidates fetched successfully", candidates)
  );
});

export const getMarkImportSubjects = asyncHandler(async (req, res) => {
  const subjects = await getMarkImportSubjectsService(req.query);

  return res.status(200).json(
    new ApiResponse(200, "Mark import subjects fetched successfully", subjects)
  );
});

export const getMarkImportCandidates = asyncHandler(async (req, res) => {
  const candidates = await getMarkImportCandidatesService(req.query);

  return res.status(200).json(
    new ApiResponse(200, "Mark import candidates fetched successfully", candidates)
  );
});

export const bulkImportMarkEntries = asyncHandler(async (req, res) => {
  const summary = await bulkImportMarkEntriesService(req.body, req.user.userId);

  return res.status(200).json(
    new ApiResponse(200, "Mark import completed successfully", summary)
  );
});

export const bulkUpsertMarkEntries = asyncHandler(async (req, res) => {
  const summary = await bulkUpsertMarkEntriesService(req.body, req.user.userId);

  return res.status(200).json(
    new ApiResponse(200, "Mark entries saved successfully", summary)
  );
});

export const getAllMarkEntries = asyncHandler(async (_req, res) => {
  const markEntries = await getAllMarkEntriesService();

  return res.status(200).json(
    new ApiResponse(200, "Mark entries fetched successfully", markEntries)
  );
});

export const getMarkEntryById = asyncHandler(async (req, res) => {
  const markEntry = await getMarkEntryByIdService(req.params.markEntryId);

  return res.status(200).json(
    new ApiResponse(200, "Mark entry fetched successfully", markEntry)
  );
});

export const updateMarkEntry = asyncHandler(async (req, res) => {
  const markEntry = await updateMarkEntryService(req.params.markEntryId, req.body);

  return res.status(200).json(
    new ApiResponse(200, "Mark entry updated successfully", markEntry)
  );
});

export const verifyMarkEntry = asyncHandler(async (req, res) => {
  const markEntry = await verifyMarkEntryService(req.params.markEntryId, req.user.userId);

  return res.status(200).json(
    new ApiResponse(200, "Mark entry verified successfully", markEntry)
  );
});

export const lockMarkEntry = asyncHandler(async (req, res) => {
  const markEntry = await lockMarkEntryService(req.params.markEntryId, req.user.userId);

  return res.status(200).json(
    new ApiResponse(200, "Mark entry locked successfully", markEntry)
  );
});