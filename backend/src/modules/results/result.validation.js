import { z } from "zod";

export const processSingleResultSchema = z.object({
  body: z.object({
    markEntryId: z.string().trim().min(1, "Mark entry ID is required")
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const processExamSessionResultsSchema = z.object({
  body: z.object({
    examSessionId: z.string().trim().min(1, "Exam session ID is required")
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const processedResultIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    processedResultId: z.string().trim().min(1, "Processed result ID is required")
  }),
  query: z.object({}).optional()
});

export const semesterSummaryIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    semesterSummaryId: z.string().trim().min(1, "Semester summary ID is required")
  }),
  query: z.object({}).optional()
});