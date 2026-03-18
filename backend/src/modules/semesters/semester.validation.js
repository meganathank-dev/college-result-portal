import { z } from "zod";

export const createSemesterSchema = z.object({
  body: z.object({
    number: z
      .number({ invalid_type_error: "Semester number must be a number" })
      .int("Semester number must be an integer")
      .min(1, "Semester number must be at least 1")
      .max(20, "Semester number must not exceed 20"),
    label: z
      .string()
      .trim()
      .min(2, "Semester label must be at least 2 characters")
      .max(50, "Semester label must not exceed 50 characters"),
    displayOrder: z
      .number({ invalid_type_error: "Display order must be a number" })
      .int("Display order must be an integer")
      .min(1, "Display order must be at least 1")
      .max(20, "Display order must not exceed 20")
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const updateSemesterSchema = z.object({
  body: z.object({
    number: z
      .number({ invalid_type_error: "Semester number must be a number" })
      .int("Semester number must be an integer")
      .min(1, "Semester number must be at least 1")
      .max(20, "Semester number must not exceed 20")
      .optional(),
    label: z
      .string()
      .trim()
      .min(2, "Semester label must be at least 2 characters")
      .max(50, "Semester label must not exceed 50 characters")
      .optional(),
    displayOrder: z
      .number({ invalid_type_error: "Display order must be a number" })
      .int("Display order must be an integer")
      .min(1, "Display order must be at least 1")
      .max(20, "Display order must not exceed 20")
      .optional(),
    isActive: z.boolean().optional()
  }),
  params: z.object({
    semesterId: z.string().trim().min(1, "Semester ID is required")
  }),
  query: z.object({}).optional()
});

export const semesterIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    semesterId: z.string().trim().min(1, "Semester ID is required")
  }),
  query: z.object({}).optional()
});