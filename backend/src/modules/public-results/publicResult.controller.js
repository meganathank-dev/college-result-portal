import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  searchPublishedResultService,
  getPublishedResultHistoryService,
  getPublishedResultForPdfService
} from "./publicResult.service.js";
import { buildPublishedResultPdf } from "./publicResult.pdf.js";

const COLLEGE_NAME = "The Kavery Engineering College (Autonomous), Mecheri";

export const searchPublishedResult = asyncHandler(async (req, res) => {
  const result = await searchPublishedResultService(req.body);

  return res.status(200).json(
    new ApiResponse(200, "Published result fetched successfully", result)
  );
});

export const getPublishedResultHistory = asyncHandler(async (req, res) => {
  const result = await getPublishedResultHistoryService({
    registerNumber: req.params.registerNumber,
    dob: req.query.dob
  });

  return res.status(200).json(
    new ApiResponse(200, "Published result history fetched successfully", result)
  );
});

export const downloadPublishedResultPdf = asyncHandler(async (req, res) => {
  const resultData = await getPublishedResultForPdfService(req.body);

  const pdfBuffer = await buildPublishedResultPdf({
    resultData,
    collegeName: COLLEGE_NAME
  });

  const safeRegNo = resultData.student.registerNumber.replace(/[^a-zA-Z0-9_-]/g, "_");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeRegNo}_grade_sheet.pdf"`
  );

  return res.send(pdfBuffer);
});