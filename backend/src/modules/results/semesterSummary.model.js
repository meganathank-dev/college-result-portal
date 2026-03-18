import mongoose from "mongoose";

const semesterSummarySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    examSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSession",
      required: true
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true
    },

    totalRegisteredSubjects: {
      type: Number,
      required: true,
      min: 0
    },
    totalPassedSubjects: {
      type: Number,
      required: true,
      min: 0
    },
    totalFailedSubjects: {
      type: Number,
      required: true,
      min: 0
    },

    totalRegisteredCredits: {
      type: Number,
      required: true,
      min: 0
    },
    totalEarnedCredits: {
      type: Number,
      required: true,
      min: 0
    },

    gpa: {
      type: Number,
      required: true,
      min: 0
    },
    cgpa: {
      type: Number,
      required: true,
      min: 0
    },

    currentArrearCount: {
      type: Number,
      required: true,
      min: 0
    },
    totalPendingArrearCount: {
      type: Number,
      required: true,
      min: 0
    },
    totalClearedArrearCount: {
      type: Number,
      required: true,
      min: 0
    },

    resultVersion: {
      type: Number,
      default: 1,
      min: 1
    },
    isPublished: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

semesterSummarySchema.index({ studentId: 1, semesterId: 1 });
semesterSummarySchema.index({ studentId: 1, examSessionId: 1 }, { unique: true });
semesterSummarySchema.index({ isPublished: 1 });

export const SemesterSummary = mongoose.model("SemesterSummary", semesterSummarySchema);