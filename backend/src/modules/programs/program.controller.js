import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  createProgramService,
  getProgramsService,
  getProgramByIdService,
  updateProgramService
} from "./program.service.js";

export const createProgram = asyncHandler(async (req, res) => {
  const program = await createProgramService(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, "Program created successfully", program));
});

export const getPrograms = asyncHandler(async (_req, res) => {
  const programs = await getProgramsService();

  return res
    .status(200)
    .json(new ApiResponse(200, "Programs fetched successfully", programs));
});

export const getProgramById = asyncHandler(async (req, res) => {
  const program = await getProgramByIdService(req.params.programId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Program fetched successfully", program));
});

export const updateProgram = asyncHandler(async (req, res) => {
  const program = await updateProgramService(req.params.programId, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, "Program updated successfully", program));
});