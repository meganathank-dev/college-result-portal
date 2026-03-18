import mongoose from "mongoose";
import { Semester } from "./semester.model.js";
import { ApiError } from "../../utils/apiError.js";

export const createSemesterService = async (payload) => {
  const existingByNumber = await Semester.findOne({ number: payload.number });
  if (existingByNumber) {
    throw new ApiError(409, "Semester number already exists");
  }

  const existingByDisplayOrder = await Semester.findOne({
    displayOrder: payload.displayOrder
  });
  if (existingByDisplayOrder) {
    throw new ApiError(409, "Semester display order already exists");
  }

  const semester = await Semester.create({
    number: payload.number,
    label: payload.label.trim(),
    displayOrder: payload.displayOrder,
    isActive: true
  });

  return semester;
};

export const getAllSemestersService = async () => {
  return Semester.find().sort({ displayOrder: 1, createdAt: -1 });
};

export const getSemesterByIdService = async (semesterId) => {
  if (!mongoose.Types.ObjectId.isValid(semesterId)) {
    throw new ApiError(400, "Invalid semester ID");
  }

  const semester = await Semester.findById(semesterId);

  if (!semester) {
    throw new ApiError(404, "Semester not found");
  }

  return semester;
};

export const updateSemesterService = async (semesterId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(semesterId)) {
    throw new ApiError(400, "Invalid semester ID");
  }

  const semester = await Semester.findById(semesterId);

  if (!semester) {
    throw new ApiError(404, "Semester not found");
  }

  if (payload.number !== undefined) {
    const existingByNumber = await Semester.findOne({
      number: payload.number,
      _id: { $ne: semesterId }
    });

    if (existingByNumber) {
      throw new ApiError(409, "Semester number already exists");
    }

    semester.number = payload.number;
  }

  if (payload.displayOrder !== undefined) {
    const existingByDisplayOrder = await Semester.findOne({
      displayOrder: payload.displayOrder,
      _id: { $ne: semesterId }
    });

    if (existingByDisplayOrder) {
      throw new ApiError(409, "Semester display order already exists");
    }

    semester.displayOrder = payload.displayOrder;
  }

  if (payload.label !== undefined) {
    semester.label = payload.label.trim();
  }

  if (payload.isActive !== undefined) {
    semester.isActive = payload.isActive;
  }

  await semester.save();

  return semester;
};

export const toggleSemesterStatusService = async (semesterId) => {
  if (!mongoose.Types.ObjectId.isValid(semesterId)) {
    throw new ApiError(400, "Invalid semester ID");
  }

  const semester = await Semester.findById(semesterId);

  if (!semester) {
    throw new ApiError(404, "Semester not found");
  }

  semester.isActive = !semester.isActive;
  await semester.save();

  return semester;
};