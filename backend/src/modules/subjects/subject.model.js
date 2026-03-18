import mongoose from "mongoose";
import { SUBJECT_TYPES } from "../../config/constants.js";

const subjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    shortName: {
      type: String,
      trim: true,
      default: ""
    },
    subjectType: {
      type: String,
      enum: Object.values(SUBJECT_TYPES),
      required: true
    },
    credits: {
      type: Number,
      required: true,
      min: 0,
      max: 20
    },
    internalMax: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    externalMax: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    totalMax: {
      type: Number,
      required: true,
      min: 0,
      max: 200
    },
    hasInternal: {
      type: Boolean,
      default: true
    },
    hasExternal: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

subjectSchema.index({ code: 1 });
subjectSchema.index({ subjectType: 1 });
subjectSchema.index({ isActive: 1 });

export const Subject = mongoose.model("Subject", subjectSchema);