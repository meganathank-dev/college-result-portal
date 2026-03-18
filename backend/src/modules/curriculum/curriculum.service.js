import mongoose from "mongoose";
import { CurriculumMapping } from "./curriculumMapping.model.js";
import { Batch } from "../batches/batch.model.js";
import { Program } from "../programs/program.model.js";
import { Regulation } from "../regulations/regulation.model.js";
import { Semester } from "../semesters/semester.model.js";
import { Subject } from "../subjects/subject.model.js";
import { ApiError } from "../../utils/apiError.js";

const validateObjectId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

const ensureRefsExist = async ({
  batchId,
  programId,
  regulationId,
  semesterId,
  subjectId
}) => {
  if (batchId !== undefined) validateObjectId(batchId, "batchId");
  if (programId !== undefined) validateObjectId(programId, "programId");
  if (regulationId !== undefined) validateObjectId(regulationId, "regulationId");
  if (semesterId !== undefined) validateObjectId(semesterId, "semesterId");
  if (subjectId !== undefined) validateObjectId(subjectId, "subjectId");

  const checks = [];

  if (batchId !== undefined) checks.push(Batch.findById(batchId));
  if (programId !== undefined) checks.push(Program.findById(programId));
  if (regulationId !== undefined) checks.push(Regulation.findById(regulationId));
  if (semesterId !== undefined) checks.push(Semester.findById(semesterId));
  if (subjectId !== undefined) checks.push(Subject.findById(subjectId));

  const results = await Promise.all(checks);

  let index = 0;

  if (batchId !== undefined && !results[index++]) {
    throw new ApiError(404, "Batch not found");
  }
  if (programId !== undefined && !results[index++]) {
    throw new ApiError(404, "Program not found");
  }
  if (regulationId !== undefined && !results[index++]) {
    throw new ApiError(404, "Regulation not found");
  }
  if (semesterId !== undefined && !results[index++]) {
    throw new ApiError(404, "Semester not found");
  }
  if (subjectId !== undefined && !results[index++]) {
    throw new ApiError(404, "Subject not found");
  }
};

const populateMapping = (query) =>
  query
    .populate("batchId", "label startYear endYear status")
    .populate("programId", "code name shortName degreeType status")
    .populate("regulationId", "code name effectiveFromBatchYear effectiveToBatchYear isActive")
    .populate("semesterId", "number label displayOrder isActive")
    .populate("subjectId", "code name shortName subjectType credits isActive");

export const createCurriculumMappingService = async (payload) => {
  await ensureRefsExist(payload);

  const existing = await CurriculumMapping.findOne({
    batchId: payload.batchId,
    programId: payload.programId,
    regulationId: payload.regulationId,
    semesterId: payload.semesterId,
    subjectId: payload.subjectId
  });

  if (existing) {
    throw new ApiError(
      409,
      "Curriculum mapping already exists for this batch, program, regulation, semester, and subject"
    );
  }

  const created = await CurriculumMapping.create({
    batchId: payload.batchId,
    programId: payload.programId,
    regulationId: payload.regulationId,
    semesterId: payload.semesterId,
    subjectId: payload.subjectId,
    sequenceNo: payload.sequenceNo ?? 0,
    isElective: payload.isElective ?? false,
    isActive: payload.isActive ?? true
  });

  return populateMapping(CurriculumMapping.findById(created._id));
};

export const getCurriculumMappingsService = async () => {
  return populateMapping(
    CurriculumMapping.find().sort({
      createdAt: -1
    })
  );
};

export const getCurriculumMappingByIdService = async (mappingId) => {
  validateObjectId(mappingId, "mappingId");

  const mapping = await populateMapping(CurriculumMapping.findById(mappingId));

  if (!mapping) {
    throw new ApiError(404, "Curriculum mapping not found");
  }

  return mapping;
};

export const updateCurriculumMappingService = async (mappingId, payload) => {
  validateObjectId(mappingId, "mappingId");

  const existing = await CurriculumMapping.findById(mappingId);
  if (!existing) {
    throw new ApiError(404, "Curriculum mapping not found");
  }

  await ensureRefsExist(payload);

  const merged = {
    batchId: payload.batchId ?? existing.batchId?.toString(),
    programId: payload.programId ?? existing.programId?.toString(),
    regulationId: payload.regulationId ?? existing.regulationId?.toString(),
    semesterId: payload.semesterId ?? existing.semesterId?.toString(),
    subjectId: payload.subjectId ?? existing.subjectId?.toString()
  };

  const duplicate = await CurriculumMapping.findOne({
    _id: { $ne: mappingId },
    batchId: merged.batchId,
    programId: merged.programId,
    regulationId: merged.regulationId,
    semesterId: merged.semesterId,
    subjectId: merged.subjectId
  });

  if (duplicate) {
    throw new ApiError(
      409,
      "Another curriculum mapping already exists for this batch, program, regulation, semester, and subject"
    );
  }

  if (payload.batchId !== undefined) existing.batchId = payload.batchId;
  if (payload.programId !== undefined) existing.programId = payload.programId;
  if (payload.regulationId !== undefined) existing.regulationId = payload.regulationId;
  if (payload.semesterId !== undefined) existing.semesterId = payload.semesterId;
  if (payload.subjectId !== undefined) existing.subjectId = payload.subjectId;
  if (payload.sequenceNo !== undefined) existing.sequenceNo = payload.sequenceNo;
  if (payload.isElective !== undefined) existing.isElective = payload.isElective;
  if (payload.isActive !== undefined) existing.isActive = payload.isActive;

  await existing.save();

  return populateMapping(CurriculumMapping.findById(existing._id));
};