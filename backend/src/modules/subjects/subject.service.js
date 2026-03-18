import mongoose from "mongoose";
import { Subject } from "./subject.model.js";
import { ApiError } from "../../utils/apiError.js";
import { SUBJECT_TYPES } from "../../config/constants.js";

const validateSubjectRules = ({
  subjectType,
  credits,
  internalMax,
  externalMax,
  totalMax,
  hasInternal,
  hasExternal
}) => {
  if (internalMax + externalMax !== totalMax) {
    throw new ApiError(400, "Internal max + external max must equal total max");
  }

  if (credits < 0) {
    throw new ApiError(400, "Credits cannot be negative");
  }

  if (subjectType === SUBJECT_TYPES.NON_CREDIT && credits !== 0) {
    throw new ApiError(400, "Non-credit subject must have 0 credits");
  }

  if (!hasInternal && internalMax !== 0) {
    throw new ApiError(400, "Internal max must be 0 when hasInternal is false");
  }

  if (!hasExternal && externalMax !== 0) {
    throw new ApiError(400, "External max must be 0 when hasExternal is false");
  }
};

export const createSubjectService = async (payload) => {
  const normalizedPayload = {
    code: payload.code.toUpperCase(),
    name: payload.name.trim(),
    shortName: payload.shortName?.trim() || "",
    subjectType: payload.subjectType,
    credits: payload.credits,
    internalMax: payload.internalMax,
    externalMax: payload.externalMax,
    totalMax: payload.totalMax,
    hasInternal:
      payload.hasInternal !== undefined ? payload.hasInternal : payload.internalMax > 0,
    hasExternal:
      payload.hasExternal !== undefined ? payload.hasExternal : payload.externalMax > 0
  };

  validateSubjectRules(normalizedPayload);

  const subject = await Subject.create({
    ...normalizedPayload,
    isActive: true
  });

  return subject;
};

export const getAllSubjectsService = async () => {
  return Subject.find().sort({ createdAt: -1 });
};

export const getSubjectByIdService = async (subjectId) => {
  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    throw new ApiError(400, "Invalid subject ID");
  }

  const subject = await Subject.findById(subjectId);

  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  return subject;
};

export const updateSubjectService = async (subjectId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    throw new ApiError(400, "Invalid subject ID");
  }

  const subject = await Subject.findById(subjectId);

  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  const updatedValues = {
    code: payload.code !== undefined ? payload.code.toUpperCase() : subject.code,
    name: payload.name !== undefined ? payload.name.trim() : subject.name,
    shortName:
      payload.shortName !== undefined ? payload.shortName.trim() : subject.shortName,
    subjectType:
      payload.subjectType !== undefined ? payload.subjectType : subject.subjectType,
    credits: payload.credits !== undefined ? payload.credits : subject.credits,
    internalMax:
      payload.internalMax !== undefined ? payload.internalMax : subject.internalMax,
    externalMax:
      payload.externalMax !== undefined ? payload.externalMax : subject.externalMax,
    totalMax: payload.totalMax !== undefined ? payload.totalMax : subject.totalMax,
    hasInternal:
      payload.hasInternal !== undefined ? payload.hasInternal : subject.hasInternal,
    hasExternal:
      payload.hasExternal !== undefined ? payload.hasExternal : subject.hasExternal
  };

  validateSubjectRules(updatedValues);

  subject.code = updatedValues.code;
  subject.name = updatedValues.name;
  subject.shortName = updatedValues.shortName;
  subject.subjectType = updatedValues.subjectType;
  subject.credits = updatedValues.credits;
  subject.internalMax = updatedValues.internalMax;
  subject.externalMax = updatedValues.externalMax;
  subject.totalMax = updatedValues.totalMax;
  subject.hasInternal = updatedValues.hasInternal;
  subject.hasExternal = updatedValues.hasExternal;

  if (payload.isActive !== undefined) {
    subject.isActive = payload.isActive;
  }

  await subject.save();

  return subject;
};

export const toggleSubjectStatusService = async (subjectId) => {
  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    throw new ApiError(400, "Invalid subject ID");
  }

  const subject = await Subject.findById(subjectId);

  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  subject.isActive = !subject.isActive;
  await subject.save();

  return subject;
};