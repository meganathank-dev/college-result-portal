import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  createBatchService,
  getAllBatchesService,
  getBatchByIdService,
  updateBatchService,
  toggleBatchStatusService
} from "./batch.service.js";

export const createBatch = asyncHandler(async (req, res) => {
  const batch = await createBatchService(req.body);

  return res.status(201).json(
    new ApiResponse(201, "Batch created successfully", batch)
  );
});

export const getAllBatches = asyncHandler(async (req, res) => {
  const batches = await getAllBatchesService();

  return res.status(200).json(
    new ApiResponse(200, "Batches fetched successfully", batches)
  );
});

export const getBatchById = asyncHandler(async (req, res) => {
  const batch = await getBatchByIdService(req.params.batchId);

  return res.status(200).json(
    new ApiResponse(200, "Batch fetched successfully", batch)
  );
});

export const updateBatch = asyncHandler(async (req, res) => {
  const batch = await updateBatchService(req.params.batchId, req.body);

  return res.status(200).json(
    new ApiResponse(200, "Batch updated successfully", batch)
  );
});

export const toggleBatchStatus = asyncHandler(async (req, res) => {
  const batch = await toggleBatchStatusService(req.params.batchId);

  return res.status(200).json(
    new ApiResponse(
      200,
      `Batch ${batch.isActive ? "activated" : "deactivated"} successfully`,
      batch
    )
  );
});