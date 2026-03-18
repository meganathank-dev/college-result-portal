import { z } from "zod";

export const createCurriculumMappingSchema = z.object({
  body: z.object({
    batchId: z.string().trim().min(1, "Batch is required"),
    programId: z.string().trim().min(1, "Program is required"),
    regulationId: z.string().trim().min(1, "Regulation is required"),
    semesterId: z.string().trim().min(1, "Semester is required"),
    subjectId: z.string().trim().min(1, "Subject is required"),
    sequenceNo: z.number().int().min(0).optional(),
    isElective: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
});

export const updateCurriculumMappingSchema = z.object({
  body: z.object({
    batchId: z.string().trim().min(1).optional(),
    programId: z.string().trim().min(1).optional(),
    regulationId: z.string().trim().min(1).optional(),
    semesterId: z.string().trim().min(1).optional(),
    subjectId: z.string().trim().min(1).optional(),
    sequenceNo: z.number().int().min(0).optional(),
    isElective: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
});

export const curriculumMappingIdParamSchema = z.object({
  params: z.object({
    mappingId: z.string().trim().min(1, "Mapping ID is required")
  })
});