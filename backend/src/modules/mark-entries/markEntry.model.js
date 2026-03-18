import mongoose from "mongoose";
import { MARK_ENTRY_STATUSES } from "../../config/constants.js";

const markEntrySchema = new mongoose.Schema(
  {
    examRegistrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamRegistration",
      required: true,
      unique: true
    },
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

    internalMark: {
      type: Number,
      default: 0,
      min: 0
    },
    externalMark: {
      type: Number,
      default: 0,
      min: 0
    },
    totalMark: {
      type: Number,
      default: 0,
      min: 0
    },

    isAbsent: {
      type: Boolean,
      default: false
    },
    isWithheld: {
      type: Boolean,
      default: false
    },
    isMalpractice: {
      type: Boolean,
      default: false
    },

    entryStatus: {
      type: String,
      enum: Object.values(MARK_ENTRY_STATUSES),
      default: MARK_ENTRY_STATUSES.DRAFT
    },

    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    version: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

markEntrySchema.index({ examSessionId: 1, studentId: 1 });
markEntrySchema.index({ subjectId: 1 });
markEntrySchema.index({ entryStatus: 1 });

export const MarkEntry = mongoose.model("MarkEntry", markEntrySchema);