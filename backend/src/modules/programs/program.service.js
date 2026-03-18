import mongoose from "mongoose";
import { Program } from "./program.model.js";
import { Department } from "../departments/department.model.js";
import { ApiError } from "../../utils/apiError.js";

const normalizePayload = (payload) => ({
  code: payload.code?.trim().toUpperCase(),
  name: payload.name?.trim(),
  shortName: payload.shortName?.trim(),
  degreeType: payload.degreeType?.trim().toUpperCase(),
  durationInSemesters: payload.durationInSemesters ?? 8,
  departmentId: payload.departmentId,
  status: payload.status?.trim().toUpperCase() || "ACTIVE"
});

const ensureDepartmentExists = async (departmentId) => {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new ApiError(400, "Invalid departmentId");
  }

  const department = await Department.findById(departmentId);
  if (!department) {
    throw new ApiError(404, "Department not found");
  }
};

export const createProgramService = async (payload) => {
  const normalized = normalizePayload(payload);

  await ensureDepartmentExists(normalized.departmentId);

  const existingProgram = await Program.findOne({ code: normalized.code });
  if (existingProgram) {
    throw new ApiError(409, "Program with same code already exists");
  }

  const program = await Program.create(normalized);

  return Program.findById(program._id).populate(
    "departmentId",
    "code name shortName status"
  );
};

export const getProgramsService = async () => {
  return Program.find()
    .populate("departmentId", "code name shortName status")
    .sort({ createdAt: -1 });
};

export const getProgramByIdService = async (programId) => {
  if (!mongoose.Types.ObjectId.isValid(programId)) {
    throw new ApiError(400, "Invalid programId");
  }

  const program = await Program.findById(programId).populate(
    "departmentId",
    "code name shortName status"
  );

  if (!program) {
    throw new ApiError(404, "Program not found");
  }

  return program;
};

export const updateProgramService = async (programId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(programId)) {
    throw new ApiError(400, "Invalid programId");
  }

  const existingProgram = await Program.findById(programId);
  if (!existingProgram) {
    throw new ApiError(404, "Program not found");
  }

  const updatedPayload = {};

  if (payload.code !== undefined) {
    updatedPayload.code = payload.code.trim().toUpperCase();

    const duplicate = await Program.findOne({
      code: updatedPayload.code,
      _id: { $ne: programId }
    });

    if (duplicate) {
      throw new ApiError(409, "Program with same code already exists");
    }
  }

  if (payload.name !== undefined) {
    updatedPayload.name = payload.name.trim();
  }

  if (payload.shortName !== undefined) {
    updatedPayload.shortName = payload.shortName.trim();
  }

  if (payload.degreeType !== undefined) {
    updatedPayload.degreeType = payload.degreeType.trim().toUpperCase();
  }

  if (payload.durationInSemesters !== undefined) {
    updatedPayload.durationInSemesters = payload.durationInSemesters;
  }

  if (payload.departmentId !== undefined) {
    await ensureDepartmentExists(payload.departmentId);
    updatedPayload.departmentId = payload.departmentId;
  }

  if (payload.status !== undefined) {
    updatedPayload.status = payload.status.trim().toUpperCase();
  }

  const updatedProgram = await Program.findByIdAndUpdate(programId, updatedPayload, {
    new: true,
    runValidators: true
  }).populate("departmentId", "code name shortName status");

  return updatedProgram;
};