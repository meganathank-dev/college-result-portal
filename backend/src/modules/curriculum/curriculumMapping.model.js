import mongoose from "mongoose";

const curriculumMappingSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true
    },
    regulationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Regulation",
      required: true
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true
    },
    sequenceNo: {
      type: Number,
      default: 0,
      min: 0
    },
    isElective: {
      type: Boolean,
      default: false
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

curriculumMappingSchema.index(
  {
    batchId: 1,
    programId: 1,
    regulationId: 1,
    semesterId: 1,
    subjectId: 1
  },
  { unique: true }
);

export const CurriculumMapping = mongoose.model(
  "CurriculumMapping",
  curriculumMappingSchema
);