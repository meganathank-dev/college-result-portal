import { z } from "zod";

export const createMarkEntrySchema = z.object({
  body: z.object({
    examRegistrationId: z.string().trim().min(1, "Exam registration ID is required"),
    internalMark: z
      .number({ invalid_type_error: "Internal mark must be a number" })
      .min(0)
      .optional(),
    externalMark: z
      .number({ invalid_type_error: "External mark must be a number" })
      .min(0)
      .optional(),
    isAbsent: z.boolean().optional(),
    isWithheld: z.boolean().optional(),
    isMalpractice: z.boolean().optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const getMarkEntryCandidatesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    examSessionId: z.string().trim().min(1, "Exam session ID is required"),
    programId: z.string().trim().min(1, "Program ID is required"),
    batchId: z.string().trim().min(1, "Batch ID is required"),
    studentSearch: z.string().trim().optional()
  })
});

export const getMarkImportSubjectsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    examSessionId: z.string().trim().min(1, "Exam session ID is required"),
    programId: z.string().trim().min(1, "Program ID is required"),
    batchId: z.string().trim().min(1, "Batch ID is required"),
    subjectSearch: z.string().trim().optional()
  })
});

export const getMarkImportCandidatesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    examSessionId: z.string().trim().min(1, "Exam session ID is required"),
    programId: z.string().trim().min(1, "Program ID is required"),
    batchId: z.string().trim().min(1, "Batch ID is required"),
    subjectId: z.string().trim().min(1, "Subject ID is required")
  })
});

export const bulkImportMarkEntriesSchema = z.object({
  body: z.object({
    examSessionId: z.string().trim().min(1, "Exam session ID is required"),
    programId: z.string().trim().min(1, "Program ID is required"),
    batchId: z.string().trim().min(1, "Batch ID is required"),
    subjectId: z.string().trim().min(1, "Subject ID is required"),
    rows: z
      .array(
        z.object({
          registerNumber: z.string().trim().min(1, "Register number is required"),
          subjectCode: z.string().trim().min(1, "Subject code is required"),
          subjectName: z.string().trim().optional(),
          internalMark: z
            .number({ invalid_type_error: "Internal mark must be a number" })
            .min(0)
            .optional(),
          externalMark: z
            .number({ invalid_type_error: "External mark must be a number" })
            .min(0)
            .optional(),
          total: z
            .number({ invalid_type_error: "Total must be a number" })
            .min(0)
            .optional(),
          absent: z.boolean().optional(),
          withheld: z.boolean().optional(),
          malpractice: z.boolean().optional()
        })
      )
      .min(1, "At least one row is required")
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const bulkUpsertMarkEntriesSchema = z.object({
  body: z.object({
    entries: z
      .array(
        z.object({
          examRegistrationId: z
            .string()
            .trim()
            .min(1, "Exam registration ID is required"),
          internalMark: z
            .number({ invalid_type_error: "Internal mark must be a number" })
            .min(0)
            .optional(),
          externalMark: z
            .number({ invalid_type_error: "External mark must be a number" })
            .min(0)
            .optional(),
          isAbsent: z.boolean().optional(),
          isWithheld: z.boolean().optional(),
          isMalpractice: z.boolean().optional()
        })
      )
      .min(1, "At least one mark entry row is required")
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const updateMarkEntrySchema = z.object({
  body: z.object({
    internalMark: z
      .number({ invalid_type_error: "Internal mark must be a number" })
      .min(0)
      .optional(),
    externalMark: z
      .number({ invalid_type_error: "External mark must be a number" })
      .min(0)
      .optional(),
    isAbsent: z.boolean().optional(),
    isWithheld: z.boolean().optional(),
    isMalpractice: z.boolean().optional()
  }),
  params: z.object({
    markEntryId: z.string().trim().min(1, "Mark entry ID is required")
  }),
  query: z.object({}).optional()
});

export const markEntryIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    markEntryId: z.string().trim().min(1, "Mark entry ID is required")
  }),
  query: z.object({}).optional()
});