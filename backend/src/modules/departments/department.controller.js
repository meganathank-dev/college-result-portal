import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  createDepartmentService,
  getAllDepartmentsService,
  getDepartmentByIdService,
  updateDepartmentService,
  toggleDepartmentStatusService
} from "./department.service.js";

export const createDepartment = asyncHandler(async (req, res) => {
  const department = await createDepartmentService(req.body);

  return res.status(201).json(
    new ApiResponse(201, "Department created successfully", department)
  );
});

export const getAllDepartments = asyncHandler(async (req, res) => {
  const departments = await getAllDepartmentsService();

  return res.status(200).json(
    new ApiResponse(200, "Departments fetched successfully", departments)
  );
});

export const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await getDepartmentByIdService(req.params.departmentId);

  return res.status(200).json(
    new ApiResponse(200, "Department fetched successfully", department)
  );
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await updateDepartmentService(
    req.params.departmentId,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(200, "Department updated successfully", department)
  );
});

export const toggleDepartmentStatus = asyncHandler(async (req, res) => {
  const department = await toggleDepartmentStatusService(req.params.departmentId);

  return res.status(200).json(
    new ApiResponse(
      200,
      `Department ${department.status === "ACTIVE" ? "activated" : "deactivated"} successfully`,
      department
    )
  );
});