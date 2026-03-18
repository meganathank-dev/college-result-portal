import mongoose from "mongoose";

const regulationSchema = new mongoose.Schema(
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
    effectiveFromBatchYear: {
      type: Number,
      required: true,
      min: 1900,
      max: 3000
    },
    effectiveToBatchYear: {
      type: Number,
      default: null,
      min: 1900,
      max: 3000
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

regulationSchema.index({ code: 1 }, { unique: true });
regulationSchema.index({ isActive: 1 });

export const Regulation = mongoose.model("Regulation", regulationSchema);