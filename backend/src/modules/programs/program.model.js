import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    shortName: {
      type: String,
      required: true,
      trim: true
    },
    degreeType: {
      type: String,
      required: true,
      enum: ["BE", "BTECH", "ME", "MTECH", "MBA", "MCA"],
      uppercase: true,
      trim: true
    },
    durationInSemesters: {
      type: Number,
      required: true,
      default: 8
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true
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

export const Program = mongoose.model("Program", programSchema);