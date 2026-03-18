import mongoose from "mongoose";
import { EXAM_SESSION_CATEGORIES, EXAM_SESSION_STATUSES } from "../../config/constants.js";

const examSessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    examMonth: {
      type: String,
      trim: true,
      uppercase: true,
      default: null
    },
    examYear: {
      type: Number,
      required: true,
      min: 1900,
      max: 3000
    },
    sessionCategory: {
      type: String,
      enum: Object.values(EXAM_SESSION_CATEGORIES),
      required: true
    },
    parentExamSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSession",
      default: null
    },
    status: {
      type: String,
      enum: Object.values(EXAM_SESSION_STATUSES),
      default: EXAM_SESSION_STATUSES.DRAFT
    },
    applicableRegulationIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Regulation"
      }
    ],
    applicableBatchIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch"
      }
    ],
    resultPublishedAt: {
      type: Date,
      default: null
    },
    resultPublishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

examSessionSchema.index({ examYear: 1 });
examSessionSchema.index({ sessionCategory: 1 });
examSessionSchema.index({ status: 1 });
examSessionSchema.index({ parentExamSessionId: 1 });
examSessionSchema.index({ examMonth: 1, examYear: 1, sessionCategory: 1 });

export const ExamSession = mongoose.model("ExamSession", examSessionSchema);