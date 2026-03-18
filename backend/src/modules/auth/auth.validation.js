import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Valid email is required"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});