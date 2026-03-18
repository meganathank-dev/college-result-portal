import { z } from "zod";
import { SUBJECT_TYPES } from "../../config/constants.js";

const gradeRuleSchema = z.object({
  grade: z.string().trim().min(1, "Grade is required"),
  min: z
    .number({ invalid_type_error: "Minimum mark must be a number" })
    .min(0)
    .max(100),
  max: z
    .number({ invalid_type_error: "Maximum mark must be a number" })
    .min(0)
    .max(100),
  point: z
    .number({ invalid_type_error: "Grade point must be a number" })
    .min(0)
    .max(10)
});

const subjectTypeValues = Object.values(SUBJECT_TYPES);

export const createGradingPolicySchema = z.object({
  body: z.object({
    regulationId: z.string().trim().min(1, "Regulation ID is required"),
    subjectType: z.enum(subjectTypeValues),

    internalMax: z.number().min(0).max(100),
    externalMax: z.number().min(0).max(100),
    totalMax: z.number().min(0).max(200),

    internalMin: z.number().min(0).max(100),
    externalMin: z.number().min(0).max(100),
    totalMin: z.number().min(0).max(200),

    gradeRules: z.array(gradeRuleSchema).min(1, "At least one grade rule is required"),

    gpaFormulaType: z.string().trim().optional(),
    cgpaFormulaType: z.string().trim().optional(),
    effectiveFrom: z.string().datetime().optional().nullable(),
    effectiveTo: z.string().datetime().optional().nullable()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const updateGradingPolicySchema = z.object({
  body: z.object({
    regulationId: z.string().trim().optional(),
    subjectType: z.enum(subjectTypeValues).optional(),

    internalMax: z.number().min(0).max(100).optional(),
    externalMax: z.number().min(0).max(100).optional(),
    totalMax: z.number().min(0).max(200).optional(),

    internalMin: z.number().min(0).max(100).optional(),
    externalMin: z.number().min(0).max(100).optional(),
    totalMin: z.number().min(0).max(200).optional(),

    gradeRules: z.array(gradeRuleSchema).min(1).optional(),

    gpaFormulaType: z.string().trim().optional(),
    cgpaFormulaType: z.string().trim().optional(),
    effectiveFrom: z.string().datetime().optional().nullable(),
    effectiveTo: z.string().datetime().optional().nullable(),
    isActive: z.boolean().optional()
  }),
  params: z.object({
    gradingPolicyId: z.string().trim().min(1, "Grading policy ID is required")
  }),
  query: z.object({}).optional()
});

export const gradingPolicyIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    gradingPolicyId: z.string().trim().min(1, "Grading policy ID is required")
  }),
  query: z.object({}).optional()
});