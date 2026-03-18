import { z } from "zod";

export const createDepartmentSchema = z.object({
  body: z.object({
    code: z
      .string()
      .trim()
      .min(2, "Department code must be at least 2 characters")
      .max(20, "Department code must not exceed 20 characters"),
    name: z
      .string()
      .trim()
      .min(2, "Department name must be at least 2 characters")
      .max(100, "Department name must not exceed 100 characters"),
    shortName: z
      .string()
      .trim()
      .max(50, "Short name must not exceed 50 characters")
      .optional()
      .or(z.literal(""))
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const updateDepartmentSchema = z.object({
  body: z.object({
    code: z
      .string()
      .trim()
      .min(2, "Department code must be at least 2 characters")
      .max(20, "Department code must not exceed 20 characters")
      .optional(),
    name: z
      .string()
      .trim()
      .min(2, "Department name must be at least 2 characters")
      .max(100, "Department name must not exceed 100 characters")
      .optional(),
    shortName: z
      .string()
      .trim()
      .max(50, "Short name must not exceed 50 characters")
      .optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional()
  }),
  params: z.object({
    departmentId: z.string().trim().min(1, "Department ID is required")
  }),
  query: z.object({}).optional()
});

export const departmentIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    departmentId: z.string().trim().min(1, "Department ID is required")
  }),
  query: z.object({}).optional()
});