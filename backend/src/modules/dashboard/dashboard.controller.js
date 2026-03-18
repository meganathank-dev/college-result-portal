import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { Student } from "../students/student.model.js";
import { Subject } from "../subjects/subject.model.js";
import { ExamSession } from "../exam-sessions/examSession.model.js";
import { PublishSnapshot } from "../publish/publishSnapshot.model.js";
import { MarkEntry } from "../mark-entries/markEntry.model.js";
import { ProcessedResult } from "../results/processedResult.model.js";

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const [
    totalStudents,
    totalSubjects,
    totalExamSessions,
    totalPublishedSnapshots,
    totalMarkEntries,
    totalProcessedResults,
    latestPublishedSnapshot
  ] = await Promise.all([
    Student.countDocuments(),
    Subject.countDocuments(),
    ExamSession.countDocuments(),
    PublishSnapshot.countDocuments(),
    MarkEntry.countDocuments(),
    ProcessedResult.countDocuments(),
    PublishSnapshot.findOne({})
      .sort({ createdAt: -1 })
      .populate("examSessionId", "name examMonth examYear sessionCategory status")
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Dashboard stats fetched successfully", {
      totalStudents,
      totalSubjects,
      totalExamSessions,
      totalPublishedSnapshots,
      totalMarkEntries,
      totalProcessedResults,
      latestPublishedSession: latestPublishedSnapshot?.examSessionId || null
    })
  );
});