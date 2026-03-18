import { z } from "zod";
import { ACADEMIC_STATUSES } from "../../config/constants.js";

const academicStatusValues = Object.values(ACADEMIC_STATUSES);

export const createStudentSchema = z.object({
  body: z.object({
    registerNumber: z
      .string()
      .trim()
      .min(2, "Register number is required")
      .max(50, "Register number must not exceed 50 characters"),
    universityRegisterNo: z.string().trim().optional().or(z.literal("")),
    fullName: z
      .string()
      .trim()
      .min(2, "Full name is required")
      .max(150, "Full name must not exceed 150 characters"),
    dob: z.string().datetime("Valid DOB is required"),
    gender: z.string().trim().optional().or(z.literal("")),
    mobileNo: z.string().trim().optional().or(z.literal("")),
    email: z.string().trim().email("Valid email is required").optional().or(z.literal("")),

    departmentId: z.string().trim().min(1, "Department ID is required"),
    programId: z.string().trim().min(1, "Program ID is required"),
    regulationId: z.string().trim().min(1, "Regulation ID is required"),
    batchId: z.string().trim().min(1, "Batch ID is required"),
    currentSemesterId: z.string().trim().min(1, "Current semester ID is required"),

    academicStatus: z.enum(academicStatusValues).optional(),
    admissionYear: z
      .number({ invalid_type_error: "Admission year must be a number" })
      .int("Admission year must be an integer")
      .min(1900, "Invalid admission year")
      .max(3000, "Invalid admission year")
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const updateStudentSchema = z.object({
  body: z.object({
    registerNumber: z.string().trim().min(2).max(50).optional(),
    universityRegisterNo: z.string().trim().optional(),
    fullName: z.string().trim().min(2).max(150).optional(),
    dob: z.string().datetime("Valid DOB is required").optional(),
    gender: z.string().trim().optional(),
    mobileNo: z.string().trim().optional(),
    email: z.string().trim().email("Valid email is required").optional().or(z.literal("")),

    departmentId: z.string().trim().optional(),
    programId: z.string().trim().optional(),
    regulationId: z.string().trim().optional(),
    batchId: z.string().trim().optional(),
    currentSemesterId: z.string().trim().optional(),

    academicStatus: z.enum(academicStatusValues).optional(),
    admissionYear: z
      .number({ invalid_type_error: "Admission year must be a number" })
      .int("Admission year must be an integer")
      .min(1900, "Invalid admission year")
      .max(3000, "Invalid admission year")
      .optional()
  }),
  params: z.object({
    studentId: z.string().trim().min(1, "Student ID is required")
  }),
  query: z.object({}).optional()
});

export const studentIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    studentId: z.string().trim().min(1, "Student ID is required")
  }),
  query: z.object({}).optional()
});