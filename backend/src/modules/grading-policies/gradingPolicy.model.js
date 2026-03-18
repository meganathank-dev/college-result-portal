import mongoose from "mongoose";
import { SUBJECT_TYPES } from "../../config/constants.js";

const gradeRuleSchema = new mongoose.Schema(
  {
    grade: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    min: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    max: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    point: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    }
  },
  { _id: false }
);

const gradingPolicySchema = new mongoose.Schema(
  {
    regulationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Regulation",
      required: true
    },
    subjectType: {
      type: String,
      enum: Object.values(SUBJECT_TYPES),
      required: true
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

    internalMin: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    externalMin: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    totalMin: {
      type: Number,
      required: true,
      min: 0,
      max: 200
    },

    gradeRules: {
      type: [gradeRuleSchema],
      required: true,
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one grade rule is required"
      }
    },

    gpaFormulaType: {
      type: String,
      default: "CBCS",
      trim: true,
      uppercase: true
    },
    cgpaFormulaType: {
      type: String,
      default: "CBCS",
      trim: true,
      uppercase: true
    },

    effectiveFrom: {
      type: Date,
      default: Date.now
    },
    effectiveTo: {
      type: Date,
      default: null
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

gradingPolicySchema.index({ regulationId: 1, subjectType: 1 });
gradingPolicySchema.index({ isActive: 1 });

export const GradingPolicy = mongoose.model("GradingPolicy", gradingPolicySchema);