import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true
    },
    startYear: {
      type: Number,
      required: true,
      min: 1900,
      max: 3000
    },
    endYear: {
      type: Number,
      required: true,
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

batchSchema.index({ label: 1 }, { unique: true });
batchSchema.index({ startYear: 1, endYear: 1 }, { unique: true });
batchSchema.index({ isActive: 1 });

export const Batch = mongoose.model("Batch", batchSchema);