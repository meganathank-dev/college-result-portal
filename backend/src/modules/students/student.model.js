import mongoose from "mongoose";
import { ACADEMIC_STATUSES } from "../../config/constants.js";

const studentSchema = new mongoose.Schema(
  {
    registerNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true
    },
    universityRegisterNo: {
      type: String,
      trim: true,
      default: ""
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    dob: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      trim: true,
      uppercase: true,
      default: ""
    },
    mobileNo: {
      type: String,
      trim: true,
      default: ""
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true
    },
    regulationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Regulation",
      required: true
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true
    },
    currentSemesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true
    },

    academicStatus: {
      type: String,
      enum: Object.values(ACADEMIC_STATUSES),
      default: ACADEMIC_STATUSES.ACTIVE
    },
    admissionYear: {
      type: Number,
      min: 1900,
      max: 3000,
      required: true
    }
  },
  {
    timestamps: true
  }
);

studentSchema.index({ departmentId: 1 });
studentSchema.index({ programId: 1 });
studentSchema.index({ regulationId: 1 });
studentSchema.index({ batchId: 1 });
studentSchema.index({ currentSemesterId: 1 });
studentSchema.index({ academicStatus: 1 });

export const Student = mongoose.model("Student", studentSchema);