import mongoose from "mongoose";
import { GradingPolicy } from "./gradingPolicy.model.js";
import { Regulation } from "../regulations/regulation.model.js";
import { ApiError } from "../../utils/apiError.js";

const ensureRegulationExists = async (regulationId) => {
  if (!mongoose.Types.ObjectId.isValid(regulationId)) {
    throw new ApiError(400, "Invalid regulation ID");
  }

  const regulation = await Regulation.findById(regulationId);

  if (!regulation) {
    throw new ApiError(404, "Regulation not found");
  }

  return regulation;
};

const validateGradeRules = (gradeRules) => {
  for (const rule of gradeRules) {
    if (rule.min > rule.max) {
      throw new ApiError(400, `Grade rule ${rule.grade}: min cannot be greater than max`);
    }
  }
};

const validatePolicyRules = ({
  internalMax,
  externalMax,
  totalMax,
  internalMin,
  externalMin,
  totalMin,
  gradeRules
}) => {
  if (internalMax + externalMax !== totalMax) {
    throw new ApiError(400, "Internal max + external max must equal total max");
  }

  if (internalMin > internalMax) {
    throw new ApiError(400, "Internal minimum cannot be greater than internal maximum");
  }

  if (externalMin > externalMax) {
    throw new ApiError(400, "External minimum cannot be greater than external maximum");
  }

  if (totalMin > totalMax) {
    throw new ApiError(400, "Total minimum cannot be greater than total maximum");
  }

  validateGradeRules(gradeRules);
};

export const createGradingPolicyService = async (payload) => {
  await ensureRegulationExists(payload.regulationId);

  validatePolicyRules(payload);

  const gradingPolicy = await GradingPolicy.create({
    regulationId: payload.regulationId,
    subjectType: payload.subjectType,
    internalMax: payload.internalMax,
    externalMax: payload.externalMax,
    totalMax: payload.totalMax,
    internalMin: payload.internalMin,
    externalMin: payload.externalMin,
    totalMin: payload.totalMin,
    gradeRules: payload.gradeRules.map((rule) => ({
      grade: rule.grade.toUpperCase(),
      min: rule.min,
      max: rule.max,
      point: rule.point
    })),
    gpaFormulaType: payload.gpaFormulaType?.trim()?.toUpperCase() || "CBCS",
    cgpaFormulaType: payload.cgpaFormulaType?.trim()?.toUpperCase() || "CBCS",
    effectiveFrom: payload.effectiveFrom ? new Date(payload.effectiveFrom) : new Date(),
    effectiveTo: payload.effectiveTo ? new Date(payload.effectiveTo) : null,
    isActive: true
  });

  return GradingPolicy.findById(gradingPolicy._id).populate(
    "regulationId",
    "code name effectiveFromBatchYear effectiveToBatchYear isActive"
  );
};

export const getAllGradingPoliciesService = async () => {
  return GradingPolicy.find()
    .populate("regulationId", "code name effectiveFromBatchYear effectiveToBatchYear isActive")
    .sort({ createdAt: -1 });
};

export const getGradingPolicyByIdService = async (gradingPolicyId) => {
  if (!mongoose.Types.ObjectId.isValid(gradingPolicyId)) {
    throw new ApiError(400, "Invalid grading policy ID");
  }

  const gradingPolicy = await GradingPolicy.findById(gradingPolicyId).populate(
    "regulationId",
    "code name effectiveFromBatchYear effectiveToBatchYear isActive"
  );

  if (!gradingPolicy) {
    throw new ApiError(404, "Grading policy not found");
  }

  return gradingPolicy;
};

export const updateGradingPolicyService = async (gradingPolicyId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(gradingPolicyId)) {
    throw new ApiError(400, "Invalid grading policy ID");
  }

  const gradingPolicy = await GradingPolicy.findById(gradingPolicyId);

  if (!gradingPolicy) {
    throw new ApiError(404, "Grading policy not found");
  }

  const updatedValues = {
    regulationId: payload.regulationId !== undefined ? payload.regulationId : gradingPolicy.regulationId,
    subjectType: payload.subjectType !== undefined ? payload.subjectType : gradingPolicy.subjectType,
    internalMax: payload.internalMax !== undefined ? payload.internalMax : gradingPolicy.internalMax,
    externalMax: payload.externalMax !== undefined ? payload.externalMax : gradingPolicy.externalMax,
    totalMax: payload.totalMax !== undefined ? payload.totalMax : gradingPolicy.totalMax,
    internalMin: payload.internalMin !== undefined ? payload.internalMin : gradingPolicy.internalMin,
    externalMin: payload.externalMin !== undefined ? payload.externalMin : gradingPolicy.externalMin,
    totalMin: payload.totalMin !== undefined ? payload.totalMin : gradingPolicy.totalMin,
    gradeRules: payload.gradeRules !== undefined ? payload.gradeRules : gradingPolicy.gradeRules
  };

  await ensureRegulationExists(updatedValues.regulationId);
  validatePolicyRules(updatedValues);

  gradingPolicy.regulationId = updatedValues.regulationId;
  gradingPolicy.subjectType = updatedValues.subjectType;
  gradingPolicy.internalMax = updatedValues.internalMax;
  gradingPolicy.externalMax = updatedValues.externalMax;
  gradingPolicy.totalMax = updatedValues.totalMax;
  gradingPolicy.internalMin = updatedValues.internalMin;
  gradingPolicy.externalMin = updatedValues.externalMin;
  gradingPolicy.totalMin = updatedValues.totalMin;

  if (payload.gradeRules !== undefined) {
    gradingPolicy.gradeRules = payload.gradeRules.map((rule) => ({
      grade: rule.grade.toUpperCase(),
      min: rule.min,
      max: rule.max,
      point: rule.point
    }));
  }

  if (payload.gpaFormulaType !== undefined) {
    gradingPolicy.gpaFormulaType = payload.gpaFormulaType.trim().toUpperCase();
  }

  if (payload.cgpaFormulaType !== undefined) {
    gradingPolicy.cgpaFormulaType = payload.cgpaFormulaType.trim().toUpperCase();
  }

  if (payload.effectiveFrom !== undefined) {
    gradingPolicy.effectiveFrom = payload.effectiveFrom ? new Date(payload.effectiveFrom) : null;
  }

  if (payload.effectiveTo !== undefined) {
    gradingPolicy.effectiveTo = payload.effectiveTo ? new Date(payload.effectiveTo) : null;
  }

  if (payload.isActive !== undefined) {
    gradingPolicy.isActive = payload.isActive;
  }

  await gradingPolicy.save();

  return GradingPolicy.findById(gradingPolicy._id).populate(
    "regulationId",
    "code name effectiveFromBatchYear effectiveToBatchYear isActive"
  );
};

export const toggleGradingPolicyStatusService = async (gradingPolicyId) => {
  if (!mongoose.Types.ObjectId.isValid(gradingPolicyId)) {
    throw new ApiError(400, "Invalid grading policy ID");
  }

  const gradingPolicy = await GradingPolicy.findById(gradingPolicyId);

  if (!gradingPolicy) {
    throw new ApiError(404, "Grading policy not found");
  }

  gradingPolicy.isActive = !gradingPolicy.isActive;
  await gradingPolicy.save();

  return GradingPolicy.findById(gradingPolicy._id).populate(
    "regulationId",
    "code name effectiveFromBatchYear effectiveToBatchYear isActive"
  );
};