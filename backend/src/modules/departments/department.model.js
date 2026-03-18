import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      uppercase: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

departmentSchema.index({ code: 1 }, { unique: true });
departmentSchema.index({ status: 1 });

export const Department = mongoose.model("Department", departmentSchema);