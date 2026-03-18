import { z } from "zod";
import { SUBJECT_TYPES } from "../../config/constants.js";

const subjectTypeValues = Object.values(SUBJECT_TYPES);

export const createSubjectSchema = z.object({
  body: z.object({
    code: z
      .string()
      .trim()
      .min(2, "Subject code must be at least 2 characters")
      .max(30, "Subject code must not exceed 30 characters"),
    name: z
      .string()
      .trim()
      .min(2, "Subject name must be at least 2 characters")
      .max(200, "Subject name must not exceed 200 characters"),
    shortName: z
      .string()
      .trim()
      .max(100, "Short name must not exceed 100 characters")
      .optional()
      .or(z.literal("")),
    subjectType: z.enum(subjectTypeValues),
    credits: z
      .number({ invalid_type_error: "Credits must be a number" })
      .min(0, "Credits cannot be negative")
      .max(20, "Credits must not exceed 20"),
    internalMax: z
      .number({ invalid_type_error: "Internal max must be a number" })
      .min(0, "Internal max cannot be negative")
      .max(100, "Internal max must not exceed 100"),
    externalMax: z
      .number({ invalid_type_error: "External max must be a number" })
      .min(0, "External max cannot be negative")
      .max(100, "External max must not exceed 100"),
    totalMax: z
      .number({ invalid_type_error: "Total max must be a number" })
      .min(0, "Total max cannot be negative")
      .max(200, "Total max must not exceed 200"),
    hasInternal: z.boolean().optional(),
    hasExternal: z.boolean().optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const updateSubjectSchema = z.object({
  body: z.object({
    code: z
      .string()
      .trim()
      .min(2, "Subject code must be at least 2 characters")
      .max(30, "Subject code must not exceed 30 characters")
      .optional(),
    name: z
      .string()
      .trim()
      .min(2, "Subject name must be at least 2 characters")
      .max(200, "Subject name must not exceed 200 characters")
      .optional(),
    shortName: z
      .string()
      .trim()
      .max(100, "Short name must not exceed 100 characters")
      .optional(),
    subjectType: z.enum(subjectTypeValues).optional(),
    credits: z
      .number({ invalid_type_error: "Credits must be a number" })
      .min(0, "Credits cannot be negative")
      .max(20, "Credits must not exceed 20")
      .optional(),
    internalMax: z
      .number({ invalid_type_error: "Internal max must be a number" })
      .min(0, "Internal max cannot be negative")
      .max(100, "Internal max must not exceed 100")
      .optional(),
    externalMax: z
      .number({ invalid_type_error: "External max must be a number" })
      .min(0, "External max cannot be negative")
      .max(100, "External max must not exceed 100")
      .optional(),
    totalMax: z
      .number({ invalid_type_error: "Total max must be a number" })
      .min(0, "Total max cannot be negative")
      .max(200, "Total max must not exceed 200")
      .optional(),
    hasInternal: z.boolean().optional(),
    hasExternal: z.boolean().optional(),
    isActive: z.boolean().optional()
  }),
  params: z.object({
    subjectId: z.string().trim().min(1, "Subject ID is required")
  }),
  query: z.object({}).optional()
});

export const subjectIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    subjectId: z.string().trim().min(1, "Subject ID is required")
  }),
  query: z.object({}).optional()
});