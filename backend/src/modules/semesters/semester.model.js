import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: true,
      min: 1,
      max: 20
    },
    label: {
      type: String,
      required: true,
      trim: true
    },
    displayOrder: {
      type: Number,
      required: true,
      min: 1,
      max: 20
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

semesterSchema.index({ number: 1 }, { unique: true });
semesterSchema.index({ displayOrder: 1 }, { unique: true });
semesterSchema.index({ isActive: 1 });

export const Semester = mongoose.model("Semester", semesterSchema);