import { z } from "zod";
import { ATTEMPT_TYPES } from "../../config/constants.js";

const attemptTypeValues = Object.values(ATTEMPT_TYPES);

export const createExamRegistrationSchema = z.object({
  body: z.object({
    examSessionId: z.string().trim().min(1, "Exam session ID is required"),
    studentId: z.string().trim().min(1, "Student ID is required"),
    subjectId: z.string().trim().min(1, "Subject ID is required"),
    sourceSemesterId: z.string().trim().min(1, "Source semester ID is required"),
    attemptType: z.enum(attemptTypeValues),
    attemptNumber: z
      .number({ invalid_type_error: "Attempt number must be a number" })
      .int("Attempt number must be an integer")
      .min(1, "Attempt number must be at least 1")
      .optional(),
    registrationStatus: z
      .enum(["REGISTERED", "HALLTICKET_ISSUED", "ABSENT", "COMPLETED"])
      .optional(),
    isEligible: z.boolean().optional(),
    remarks: z.string().trim().optional().or(z.literal(""))
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const autoSyncCurrentExamRegistrationsSchema = z.object({
  body: z
    .object({
      examSessionId: z.string().trim().min(1, "Exam session ID is required"),
      scopeType: z.enum(["SPECIFIC", "ALL"]).optional(),
      programId: z.string().trim().optional(),
      batchId: z.string().trim().optional()
    })
    .superRefine((data, ctx) => {
      const scopeType = data.scopeType || "SPECIFIC";

      if (scopeType === "SPECIFIC") {
        if (!data.programId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["programId"],
            message: "Program ID is required for SPECIFIC scope"
          });
        }

        if (!data.batchId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["batchId"],
            message: "Batch ID is required for SPECIFIC scope"
          });
        }
      }
    }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const getArrearCandidatesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    examSessionId: z.string().trim().min(1, "Exam session ID is required"),
    programId: z.string().trim().optional(),
    batchId: z.string().trim().optional(),
    studentSearch: z.string().trim().optional()
  })
});

export const registerArrearCandidatesSchema = z.object({
  body: z.object({
    examSessionId: z.string().trim().min(1, "Exam session ID is required"),
    registrations: z.array(
      z.object({
        studentId: z.string().trim().min(1, "Student ID is required"),
        subjectId: z.string().trim().min(1, "Subject ID is required"),
        sourceSemesterId: z.string().trim().min(1, "Source semester ID is required"),
        attemptNumber: z
          .number({ invalid_type_error: "Attempt number must be a number" })
          .int("Attempt number must be an integer")
          .min(1, "Attempt number must be at least 1")
          .optional()
      })
    ).min(1, "At least one arrear registration is required")
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const updateExamRegistrationSchema = z.object({
  body: z.object({
    examSessionId: z.string().trim().optional(),
    studentId: z.string().trim().optional(),
    subjectId: z.string().trim().optional(),
    sourceSemesterId: z.string().trim().optional(),
    attemptType: z.enum(attemptTypeValues).optional(),
    attemptNumber: z
      .number({ invalid_type_error: "Attempt number must be a number" })
      .int("Attempt number must be an integer")
      .min(1, "Attempt number must be at least 1")
      .optional(),
    registrationStatus: z
      .enum(["REGISTERED", "HALLTICKET_ISSUED", "ABSENT", "COMPLETED"])
      .optional(),
    isEligible: z.boolean().optional(),
    remarks: z.string().trim().optional()
  }),
  params: z.object({
    examRegistrationId: z.string().trim().min(1, "Exam registration ID is required")
  }),
  query: z.object({}).optional()
});

export const examRegistrationIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    examRegistrationId: z.string().trim().min(1, "Exam registration ID is required")
  }),
  query: z.object({}).optional()
});