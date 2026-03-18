import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  createCurriculumMappingService,
  getCurriculumMappingsService,
  getCurriculumMappingByIdService,
  updateCurriculumMappingService
} from "./curriculum.service.js";

export const createCurriculumMapping = asyncHandler(async (req, res) => {
  const mapping = await createCurriculumMappingService(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, "Curriculum mapping created successfully", mapping));
});

export const getCurriculumMappings = asyncHandler(async (_req, res) => {
  const mappings = await getCurriculumMappingsService();

  return res
    .status(200)
    .json(new ApiResponse(200, "Curriculum mappings fetched successfully", mappings));
});

export const getCurriculumMappingById = asyncHandler(async (req, res) => {
  const mapping = await getCurriculumMappingByIdService(req.params.mappingId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Curriculum mapping fetched successfully", mapping));
});

export const updateCurriculumMapping = asyncHandler(async (req, res) => {
  const mapping = await updateCurriculumMappingService(req.params.mappingId, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, "Curriculum mapping updated successfully", mapping));
});