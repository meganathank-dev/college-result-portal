import mongoose from "mongoose";
import { ATTEMPT_TYPES } from "../../config/constants.js";

const examRegistrationSchema = new mongoose.Schema(
  {
    examSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSession",
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true
    },
    sourceSemesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true
    },
    attemptType: {
      type: String,
      enum: Object.values(ATTEMPT_TYPES),
      required: true
    },
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    registrationStatus: {
      type: String,
      enum: ["REGISTERED", "HALLTICKET_ISSUED", "ABSENT", "COMPLETED"],
      default: "REGISTERED"
    },
    isEligible: {
      type: Boolean,
      default: true
    },
    remarks: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

examRegistrationSchema.index(
  { examSessionId: 1, studentId: 1, subjectId: 1 },
  { unique: true }
);

examRegistrationSchema.index({ studentId: 1, subjectId: 1, attemptNumber: 1 });
examRegistrationSchema.index({ examSessionId: 1, subjectId: 1 });
examRegistrationSchema.index({ attemptType: 1 });
examRegistrationSchema.index({ registrationStatus: 1 });

export const ExamRegistration = mongoose.model(
  "ExamRegistration",
  examRegistrationSchema
);