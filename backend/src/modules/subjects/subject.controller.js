import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  createSubjectService,
  getAllSubjectsService,
  getSubjectByIdService,
  updateSubjectService,
  toggleSubjectStatusService
} from "./subject.service.js";

export const createSubject = asyncHandler(async (req, res) => {
  const subject = await createSubjectService(req.body);

  return res.status(201).json(
    new ApiResponse(201, "Subject created successfully", subject)
  );
});

export const getAllSubjects = asyncHandler(async (req, res) => {
  const subjects = await getAllSubjectsService();

  return res.status(200).json(
    new ApiResponse(200, "Subjects fetched successfully", subjects)
  );
});

export const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await getSubjectByIdService(req.params.subjectId);

  return res.status(200).json(
    new ApiResponse(200, "Subject fetched successfully", subject)
  );
});

export const updateSubject = asyncHandler(async (req, res) => {
  const subject = await updateSubjectService(req.params.subjectId, req.body);

  return res.status(200).json(
    new ApiResponse(200, "Subject updated successfully", subject)
  );
});

export const toggleSubjectStatus = asyncHandler(async (req, res) => {
  const subject = await toggleSubjectStatusService(req.params.subjectId);

  return res.status(200).json(
    new ApiResponse(
      200,
      `Subject ${subject.isActive ? "activated" : "deactivated"} successfully`,
      subject
    )
  );
});