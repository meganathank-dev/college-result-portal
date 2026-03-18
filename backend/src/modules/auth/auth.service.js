import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../users/user.model.js";
import { ApiError } from "../../utils/apiError.js";
import { env } from "../../config/env.js";

const createAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role
    },
    env.jwtAccessSecret,
    {
      expiresIn: env.jwtAccessExpiresIn
    }
  );
};

const createRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user._id
    },
    env.jwtRefreshSecret,
    {
      expiresIn: env.jwtRefreshExpiresIn
    }
  );
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account is inactive");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  user.lastLoginAt = new Date();
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      mobileNo: user.mobileNo,
      role: user.role,
      departmentIds: user.departmentIds,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt
    }
  };
};

export const getMe = async (userId) => {
  const user = await User.findById(userId).select("-passwordHash");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};