import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  autoSyncCurrentExamRegistrationsService,
  createExamRegistrationService,
  getAllExamRegistrationsService,
  getArrearCandidatesService,
  getExamRegistrationByIdService,
  registerArrearCandidatesService,
  updateExamRegistrationService,
  toggleExamRegistrationEligibilityService
} from "./examRegistration.service.js";

export const createExamRegistration = asyncHandler(async (req, res) => {
  const examRegistration = await createExamRegistrationService(req.body);

  return res.status(201).json(
    new ApiResponse(201, "Exam registration created successfully", examRegistration)
  );
});

export const autoSyncCurrentExamRegistrations = asyncHandler(async (req, res) => {
  const summary = await autoSyncCurrentExamRegistrationsService(req.body);

  return res.status(200).json(
    new ApiResponse(200, "Current exam registrations synced successfully", summary)
  );
});

export const getArrearCandidates = asyncHandler(async (req, res) => {
  const candidates = await getArrearCandidatesService(req.query);

  return res.status(200).json(
    new ApiResponse(200, "Arrear candidates fetched successfully", candidates)
  );
});

export const registerArrearCandidates = asyncHandler(async (req, res) => {
  const summary = await registerArrearCandidatesService(req.body);

  return res.status(201).json(
    new ApiResponse(201, "Arrear registrations created successfully", summary)
  );
});

export const getAllExamRegistrations = asyncHandler(async (_req, res) => {
  const examRegistrations = await getAllExamRegistrationsService();

  return res.status(200).json(
    new ApiResponse(200, "Exam registrations fetched successfully", examRegistrations)
  );
});

export const getExamRegistrationById = asyncHandler(async (req, res) => {
  const examRegistration = await getExamRegistrationByIdService(
    req.params.examRegistrationId
  );

  return res.status(200).json(
    new ApiResponse(200, "Exam registration fetched successfully", examRegistration)
  );
});

export const updateExamRegistration = asyncHandler(async (req, res) => {
  const examRegistration = await updateExamRegistrationService(
    req.params.examRegistrationId,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(200, "Exam registration updated successfully", examRegistration)
  );
});

export const toggleExamRegistrationEligibility = asyncHandler(async (req, res) => {
  const examRegistration = await toggleExamRegistrationEligibilityService(
    req.params.examRegistrationId
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      `Exam registration eligibility changed to ${examRegistration.isEligible}`,
      examRegistration
    )
  );
});