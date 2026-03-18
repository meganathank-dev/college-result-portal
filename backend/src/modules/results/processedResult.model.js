import mongoose from "mongoose";
import { PASS_STATUSES, ATTEMPT_TYPES } from "../../config/constants.js";

const processedResultSchema = new mongoose.Schema(
  {
    examSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSession",
      required: true
    },
    examRegistrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamRegistration",
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
      min: 1
    },

    internalMark: {
      type: Number,
      required: true,
      min: 0
    },
    externalMark: {
      type: Number,
      required: true,
      min: 0
    },
    totalMark: {
      type: Number,
      required: true,
      min: 0
    },

    passStatus: {
      type: String,
      enum: Object.values(PASS_STATUSES),
      required: true
    },
    grade: {
      type: String,
      required: true,
      trim: true
    },
    gradePoint: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    creditsEarned: {
      type: Number,
      required: true,
      min: 0
    },

    gradingPolicyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GradingPolicy",
      required: true
    },

    resultVersion: {
      type: Number,
      default: 1,
      min: 1
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    processedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

processedResultSchema.index({ examRegistrationId: 1 }, { unique: true });
processedResultSchema.index({ studentId: 1, examSessionId: 1 });
processedResultSchema.index({ studentId: 1, subjectId: 1 });
processedResultSchema.index({ grade: 1 });
processedResultSchema.index({ passStatus: 1 });

export const ProcessedResult = mongoose.model("ProcessedResult", processedResultSchema);