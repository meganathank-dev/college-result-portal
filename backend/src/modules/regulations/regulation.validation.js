import { z } from "zod";

export const createRegulationSchema = z.object({
  body: z.object({
    code: z
      .string()
      .trim()
      .min(2, "Regulation code must be at least 2 characters")
      .max(20, "Regulation code must not exceed 20 characters"),
    name: z
      .string()
      .trim()
      .min(2, "Regulation name must be at least 2 characters")
      .max(100, "Regulation name must not exceed 100 characters"),
    effectiveFromBatchYear: z
      .number({ invalid_type_error: "Effective from batch year must be a number" })
      .int("Effective from batch year must be an integer")
      .min(1900, "Invalid year")
      .max(3000, "Invalid year"),
    effectiveToBatchYear: z
      .number({ invalid_type_error: "Effective to batch year must be a number" })
      .int("Effective to batch year must be an integer")
      .min(1900, "Invalid year")
      .max(3000, "Invalid year")
      .nullable()
      .optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const updateRegulationSchema = z.object({
  body: z.object({
    code: z
      .string()
      .trim()
      .min(2, "Regulation code must be at least 2 characters")
      .max(20, "Regulation code must not exceed 20 characters")
      .optional(),
    name: z
      .string()
      .trim()
      .min(2, "Regulation name must be at least 2 characters")
      .max(100, "Regulation name must not exceed 100 characters")
      .optional(),
    effectiveFromBatchYear: z
      .number({ invalid_type_error: "Effective from batch year must be a number" })
      .int("Effective from batch year must be an integer")
      .min(1900, "Invalid year")
      .max(3000, "Invalid year")
      .optional(),
    effectiveToBatchYear: z
      .number({ invalid_type_error: "Effective to batch year must be a number" })
      .int("Effective to batch year must be an integer")
      .min(1900, "Invalid year")
      .max(3000, "Invalid year")
      .nullable()
      .optional(),
    isActive: z.boolean().optional()
  }),
  params: z.object({
    regulationId: z.string().trim().min(1, "Regulation ID is required")
  }),
  query: z.object({}).optional()
});

export const regulationIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    regulationId: z.string().trim().min(1, "Regulation ID is required")
  }),
  query: z.object({}).optional()
});