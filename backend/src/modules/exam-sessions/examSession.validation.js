import { z } from "zod";
import { EXAM_SESSION_CATEGORIES, EXAM_SESSION_STATUSES } from "../../config/constants.js";

const categoryValues = Object.values(EXAM_SESSION_CATEGORIES);
const statusValues = Object.values(EXAM_SESSION_STATUSES);

export const createExamSessionSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Session name is required")
      .max(200, "Session name must not exceed 200 characters"),
    examMonth: z
      .string()
      .trim()
      .min(2, "Exam month must be at least 2 characters")
      .max(20, "Exam month must not exceed 20 characters")
      .optional()
      .nullable(),
    examYear: z
      .number({ invalid_type_error: "Exam year must be a number" })
      .int("Exam year must be an integer")
      .min(1900, "Invalid exam year")
      .max(3000, "Invalid exam year"),
    sessionCategory: z.enum(categoryValues),
    parentExamSessionId: z.string().trim().optional().nullable(),
    applicableRegulationIds: z.array(z.string().trim()).optional(),
    applicableBatchIds: z.array(z.string().trim()).optional(),
    notes: z.string().trim().optional().or(z.literal(""))
  }).superRefine((data, ctx) => {
    if (data.sessionCategory === "REGULAR" && !data.examMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["examMonth"],
        message: "Exam month is required for REGULAR sessions"
      });
    }

    if (data.sessionCategory === "REVALUATION" && !data.parentExamSessionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["parentExamSessionId"],
        message: "Parent exam session is required for REVALUATION sessions"
      });
    }
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const updateExamSessionSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(200).optional(),
    examMonth: z.string().trim().min(2).max(20).optional().nullable(),
    examYear: z
      .number({ invalid_type_error: "Exam year must be a number" })
      .int("Exam year must be an integer")
      .min(1900)
      .max(3000)
      .optional(),
    sessionCategory: z.enum(categoryValues).optional(),
    parentExamSessionId: z.string().trim().optional().nullable(),
    status: z.enum(statusValues).optional(),
    applicableRegulationIds: z.array(z.string().trim()).optional(),
    applicableBatchIds: z.array(z.string().trim()).optional(),
    notes: z.string().trim().optional(),
    resultPublishedAt: z.string().datetime().optional().nullable(),
    resultPublishedBy: z.string().trim().optional().nullable()
  }),
  params: z.object({
    examSessionId: z.string().trim().min(1, "Exam session ID is required")
  }),
  query: z.object({}).optional()
});

export const examSessionIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    examSessionId: z.string().trim().min(1, "Exam session ID is required")
  }),
  query: z.object({}).optional()
});