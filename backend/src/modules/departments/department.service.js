import mongoose from "mongoose";
import { Department } from "./department.model.js";
import { ApiError } from "../../utils/apiError.js";

export const createDepartmentService = async (payload) => {
  const existingDepartment = await Department.findOne({
    code: payload.code.toUpperCase()
  });

  if (existingDepartment) {
    throw new ApiError(409, "Department code already exists");
  }

  const department = await Department.create({
    code: payload.code.toUpperCase(),
    name: payload.name.trim(),
    shortName: payload.shortName?.trim() || "",
    status: "ACTIVE"
  });

  return department;
};

export const getAllDepartmentsService = async () => {
  const departments = await Department.find().sort({ createdAt: -1 });
  return departments;
};

export const getDepartmentByIdService = async (departmentId) => {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new ApiError(400, "Invalid department ID");
  }

  const department = await Department.findById(departmentId);

  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  return department;
};

export const updateDepartmentService = async (departmentId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new ApiError(400, "Invalid department ID");
  }

  const department = await Department.findById(departmentId);

  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  if (payload.code) {
    const existingDepartment = await Department.findOne({
      code: payload.code.toUpperCase(),
      _id: { $ne: departmentId }
    });

    if (existingDepartment) {
      throw new ApiError(409, "Department code already exists");
    }

    department.code = payload.code.toUpperCase();
  }

  if (payload.name !== undefined) {
    department.name = payload.name.trim();
  }

  if (payload.shortName !== undefined) {
    department.shortName = payload.shortName.trim();
  }

  if (payload.status !== undefined) {
    department.status = payload.status.toUpperCase();
  } else if (department.status) {
    department.status = department.status.toUpperCase();
  } else {
    department.status = "ACTIVE";
  }

  await department.save();

  return department;
};

export const toggleDepartmentStatusService = async (departmentId) => {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new ApiError(400, "Invalid department ID");
  }

  const department = await Department.findById(departmentId);

  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  const currentStatus = (department.status || "ACTIVE").toUpperCase();
  department.status = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  await department.save();

  return department;
};