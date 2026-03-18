import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { loginUser, getMe } from "./auth.service.js";

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);

  return res.status(200).json(
    new ApiResponse(200, "Login successful", result)
  );
});

export const me = asyncHandler(async (req, res) => {
  const user = await getMe(req.user.userId);

  return res.status(200).json(
    new ApiResponse(200, "User profile fetched successfully", user)
  );
});