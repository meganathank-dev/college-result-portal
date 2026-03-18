import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  createGradingPolicyService,
  getAllGradingPoliciesService,
  getGradingPolicyByIdService,
  updateGradingPolicyService,
  toggleGradingPolicyStatusService
} from "./gradingPolicy.service.js";

export const createGradingPolicy = asyncHandler(async (req, res) => {
  const gradingPolicy = await createGradingPolicyService(req.body);

  return res.status(201).json(
    new ApiResponse(201, "Grading policy created successfully", gradingPolicy)
  );
});

export const getAllGradingPolicies = asyncHandler(async (req, res) => {
  const gradingPolicies = await getAllGradingPoliciesService();

  return res.status(200).json(
    new ApiResponse(200, "Grading policies fetched successfully", gradingPolicies)
  );
});

export const getGradingPolicyById = asyncHandler(async (req, res) => {
  const gradingPolicy = await getGradingPolicyByIdService(req.params.gradingPolicyId);

  return res.status(200).json(
    new ApiResponse(200, "Grading policy fetched successfully", gradingPolicy)
  );
});

export const updateGradingPolicy = asyncHandler(async (req, res) => {
  const gradingPolicy = await updateGradingPolicyService(
    req.params.gradingPolicyId,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(200, "Grading policy updated successfully", gradingPolicy)
  );
});

export const toggleGradingPolicyStatus = asyncHandler(async (req, res) => {
  const gradingPolicy = await toggleGradingPolicyStatusService(req.params.gradingPolicyId);

  return res.status(200).json(
    new ApiResponse(
      200,
      `Grading policy ${gradingPolicy.isActive ? "activated" : "deactivated"} successfully`,
      gradingPolicy
    )
  );
});