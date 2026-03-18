import { z } from "zod";

export const createBatchSchema = z.object({
  body: z.object({
    label: z
      .string()
      .trim()
      .min(4, "Batch label must be at least 4 characters")
      .max(20, "Batch label must not exceed 20 characters"),
    startYear: z
      .number({ invalid_type_error: "Start year must be a number" })
      .int("Start year must be an integer")
      .min(1900, "Invalid start year")
      .max(3000, "Invalid start year"),
    endYear: z
      .number({ invalid_type_error: "End year must be a number" })
      .int("End year must be an integer")
      .min(1900, "Invalid end year")
      .max(3000, "Invalid end year")
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const updateBatchSchema = z.object({
  body: z.object({
    label: z
      .string()
      .trim()
      .min(4, "Batch label must be at least 4 characters")
      .max(20, "Batch label must not exceed 20 characters")
      .optional(),
    startYear: z
      .number({ invalid_type_error: "Start year must be a number" })
      .int("Start year must be an integer")
      .min(1900, "Invalid start year")
      .max(3000, "Invalid start year")
      .optional(),
    endYear: z
      .number({ invalid_type_error: "End year must be a number" })
      .int("End year must be an integer")
      .min(1900, "Invalid end year")
      .max(3000, "Invalid end year")
      .optional(),
    isActive: z.boolean().optional()
  }),
  params: z.object({
    batchId: z.string().trim().min(1, "Batch ID is required")
  }),
  query: z.object({}).optional()
});

export const batchIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    batchId: z.string().trim().min(1, "Batch ID is required")
  }),
  query: z.object({}).optional()
});