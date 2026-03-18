import mongoose from "mongoose";
import { Regulation } from "./regulation.model.js";
import { ApiError } from "../../utils/apiError.js";

const validateBatchYearRange = (fromYear, toYear) => {
  if (toYear !== null && toYear !== undefined && fromYear > toYear) {
    throw new ApiError(400, "Effective from batch year cannot be greater than effective to batch year");
  }
};

export const createRegulationService = async (payload) => {
  const existingRegulation = await Regulation.findOne({
    code: payload.code.toUpperCase()
  });

  if (existingRegulation) {
    throw new ApiError(409, "Regulation code already exists");
  }

  validateBatchYearRange(
    payload.effectiveFromBatchYear,
    payload.effectiveToBatchYear ?? null
  );

  const regulation = await Regulation.create({
    code: payload.code.toUpperCase(),
    name: payload.name.trim(),
    effectiveFromBatchYear: payload.effectiveFromBatchYear,
    effectiveToBatchYear: payload.effectiveToBatchYear ?? null,
    isActive: true
  });

  return regulation;
};

export const getAllRegulationsService = async () => {
  return Regulation.find().sort({ createdAt: -1 });
};

export const getRegulationByIdService = async (regulationId) => {
  if (!mongoose.Types.ObjectId.isValid(regulationId)) {
    throw new ApiError(400, "Invalid regulation ID");
  }

  const regulation = await Regulation.findById(regulationId);

  if (!regulation) {
    throw new ApiError(404, "Regulation not found");
  }

  return regulation;
};

export const updateRegulationService = async (regulationId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(regulationId)) {
    throw new ApiError(400, "Invalid regulation ID");
  }

  const regulation = await Regulation.findById(regulationId);

  if (!regulation) {
    throw new ApiError(404, "Regulation not found");
  }

  if (payload.code) {
    const existingRegulation = await Regulation.findOne({
      code: payload.code.toUpperCase(),
      _id: { $ne: regulationId }
    });

    if (existingRegulation) {
      throw new ApiError(409, "Regulation code already exists");
    }

    regulation.code = payload.code.toUpperCase();
  }

  if (payload.name !== undefined) {
    regulation.name = payload.name.trim();
  }

  const fromYear =
    payload.effectiveFromBatchYear !== undefined
      ? payload.effectiveFromBatchYear
      : regulation.effectiveFromBatchYear;

  const toYear =
    payload.effectiveToBatchYear !== undefined
      ? payload.effectiveToBatchYear
      : regulation.effectiveToBatchYear;

  validateBatchYearRange(fromYear, toYear);

  if (payload.effectiveFromBatchYear !== undefined) {
    regulation.effectiveFromBatchYear = payload.effectiveFromBatchYear;
  }

  if (payload.effectiveToBatchYear !== undefined) {
    regulation.effectiveToBatchYear = payload.effectiveToBatchYear;
  }

  if (payload.isActive !== undefined) {
    regulation.isActive = payload.isActive;
  }

  await regulation.save();

  return regulation;
};

export const toggleRegulationStatusService = async (regulationId) => {
  if (!mongoose.Types.ObjectId.isValid(regulationId)) {
    throw new ApiError(400, "Invalid regulation ID");
  }

  const regulation = await Regulation.findById(regulationId);

  if (!regulation) {
    throw new ApiError(404, "Regulation not found");
  }

  regulation.isActive = !regulation.isActive;
  await regulation.save();

  return regulation;
};