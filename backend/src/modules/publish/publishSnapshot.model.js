import mongoose from "mongoose";
import { PUBLISH_SNAPSHOT_STATUSES } from "../../config/constants.js";

const publishSnapshotSchema = new mongoose.Schema(
  {
    examSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSession",
      required: true
    },
    snapshotVersion: {
      type: Number,
      required: true,
      min: 1
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    totalStudents: {
      type: Number,
      required: true,
      min: 0
    },
    totalSubjects: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: Object.values(PUBLISH_SNAPSHOT_STATUSES),
      default: PUBLISH_SNAPSHOT_STATUSES.ACTIVE
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

publishSnapshotSchema.index({ examSessionId: 1, snapshotVersion: 1 }, { unique: true });
publishSnapshotSchema.index({ status: 1 });

export const PublishSnapshot = mongoose.model("PublishSnapshot", publishSnapshotSchema);