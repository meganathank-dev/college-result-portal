import { z } from "zod";

export const searchPublishedResultSchema = z.object({
  body: z.object({
    registerNumber: z
      .string()
      .trim()
      .min(2, "Register number is required")
      .max(50, "Register number must not exceed 50 characters"),
    dob: z.string().datetime("Valid DOB is required")
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const registerNumberParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    registerNumber: z.string().trim().min(2, "Register number is required")
  }),
  query: z.object({
    dob: z.string().datetime("Valid DOB is required")
  })
});