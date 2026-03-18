import mongoose from "mongoose";
import { Batch } from "./batch.model.js";
import { ApiError } from "../../utils/apiError.js";

const validateYearRange = (startYear, endYear) => {
  if (startYear >= endYear) {
    throw new ApiError(400, "End year must be greater than start year");
  }

  if (endYear - startYear !== 4) {
    throw new ApiError(400, "Engineering batch must have a 4-year gap (example: 2023-2027)");
  }
};

export const createBatchService = async (payload) => {
  validateYearRange(payload.startYear, payload.endYear);

  const label = payload.label.trim();
  const existingBatchByLabel = await Batch.findOne({ label });

  if (existingBatchByLabel) {
    throw new ApiError(409, "Batch label already exists");
  }

  const existingBatchByYears = await Batch.findOne({
    startYear: payload.startYear,
    endYear: payload.endYear
  });

  if (existingBatchByYears) {
    throw new ApiError(409, "Batch with same start year and end year already exists");
  }

  const batch = await Batch.create({
    label,
    startYear: payload.startYear,
    endYear: payload.endYear,
    isActive: true
  });

  return batch;
};

export const getAllBatchesService = async () => {
  return Batch.find().sort({ createdAt: -1 });
};

export const getBatchByIdService = async (batchId) => {
  if (!mongoose.Types.ObjectId.isValid(batchId)) {
    throw new ApiError(400, "Invalid batch ID");
  }

  const batch = await Batch.findById(batchId);

  if (!batch) {
    throw new ApiError(404, "Batch not found");
  }

  return batch;
};

export const updateBatchService = async (batchId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(batchId)) {
    throw new ApiError(400, "Invalid batch ID");
  }

  const batch = await Batch.findById(batchId);

  if (!batch) {
    throw new ApiError(404, "Batch not found");
  }

  const newStartYear =
    payload.startYear !== undefined ? payload.startYear : batch.startYear;
  const newEndYear =
    payload.endYear !== undefined ? payload.endYear : batch.endYear;

  validateYearRange(newStartYear, newEndYear);

  if (payload.label !== undefined) {
    const existingBatchByLabel = await Batch.findOne({
      label: payload.label.trim(),
      _id: { $ne: batchId }
    });

    if (existingBatchByLabel) {
      throw new ApiError(409, "Batch label already exists");
    }

    batch.label = payload.label.trim();
  }

  const existingBatchByYears = await Batch.findOne({
    startYear: newStartYear,
    endYear: newEndYear,
    _id: { $ne: batchId }
  });

  if (existingBatchByYears) {
    throw new ApiError(409, "Batch with same start year and end year already exists");
  }

  if (payload.startYear !== undefined) {
    batch.startYear = payload.startYear;
  }

  if (payload.endYear !== undefined) {
    batch.endYear = payload.endYear;
  }

  if (payload.isActive !== undefined) {
    batch.isActive = payload.isActive;
  }

  await batch.save();

  return batch;
};

export const toggleBatchStatusService = async (batchId) => {
  if (!mongoose.Types.ObjectId.isValid(batchId)) {
    throw new ApiError(400, "Invalid batch ID");
  }

  const batch = await Batch.findById(batchId);

  if (!batch) {
    throw new ApiError(404, "Batch not found");
  }

  batch.isActive = !batch.isActive;
  await batch.save();

  return batch;
};