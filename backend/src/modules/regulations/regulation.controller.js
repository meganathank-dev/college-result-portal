import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  createRegulationService,
  getAllRegulationsService,
  getRegulationByIdService,
  updateRegulationService,
  toggleRegulationStatusService
} from "./regulation.service.js";

export const createRegulation = asyncHandler(async (req, res) => {
  const regulation = await createRegulationService(req.body);

  return res.status(201).json(
    new ApiResponse(201, "Regulation created successfully", regulation)
  );
});

export const getAllRegulations = asyncHandler(async (req, res) => {
  const regulations = await getAllRegulationsService();

  return res.status(200).json(
    new ApiResponse(200, "Regulations fetched successfully", regulations)
  );
});

export const getRegulationById = asyncHandler(async (req, res) => {
  const regulation = await getRegulationByIdService(req.params.regulationId);

  return res.status(200).json(
    new ApiResponse(200, "Regulation fetched successfully", regulation)
  );
});

export const updateRegulation = asyncHandler(async (req, res) => {
  const regulation = await updateRegulationService(
    req.params.regulationId,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(200, "Regulation updated successfully", regulation)
  );
});

export const toggleRegulationStatus = asyncHandler(async (req, res) => {
  const regulation = await toggleRegulationStatusService(req.params.regulationId);

  return res.status(200).json(
    new ApiResponse(
      200,
      `Regulation ${regulation.isActive ? "activated" : "deactivated"} successfully`,
      regulation
    )
  );
});