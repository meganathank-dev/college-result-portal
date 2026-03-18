import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  createSemesterService,
  getAllSemestersService,
  getSemesterByIdService,
  updateSemesterService,
  toggleSemesterStatusService
} from "./semester.service.js";

export const createSemester = asyncHandler(async (req, res) => {
  const semester = await createSemesterService(req.body);

  return res.status(201).json(
    new ApiResponse(201, "Semester created successfully", semester)
  );
});

export const getAllSemesters = asyncHandler(async (req, res) => {
  const semesters = await getAllSemestersService();

  return res.status(200).json(
    new ApiResponse(200, "Semesters fetched successfully", semesters)
  );
});

export const getSemesterById = asyncHandler(async (req, res) => {
  const semester = await getSemesterByIdService(req.params.semesterId);

  return res.status(200).json(
    new ApiResponse(200, "Semester fetched successfully", semester)
  );
});

export const updateSemester = asyncHandler(async (req, res) => {
  const semester = await updateSemesterService(req.params.semesterId, req.body);

  return res.status(200).json(
    new ApiResponse(200, "Semester updated successfully", semester)
  );
});

export const toggleSemesterStatus = asyncHandler(async (req, res) => {
  const semester = await toggleSemesterStatusService(req.params.semesterId);

  return res.status(200).json(
    new ApiResponse(
      200,
      `Semester ${semester.isActive ? "activated" : "deactivated"} successfully`,
      semester
    )
  );
});