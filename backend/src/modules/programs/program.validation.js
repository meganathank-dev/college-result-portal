import { z } from "zod";

export const createProgramSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1, "Program code is required"),
    name: z.string().trim().min(1, "Program name is required"),
    shortName: z.string().trim().min(1, "Short name is required"),
    degreeType: z.enum(["BE", "BTECH", "ME", "MTECH", "MBA", "MCA"]),
    durationInSemesters: z.number().int().positive().default(8),
    departmentId: z.string().trim().min(1, "Department is required"),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional()
  })
});

export const updateProgramSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1, "Program code is required").optional(),
    name: z.string().trim().min(1, "Program name is required").optional(),
    shortName: z.string().trim().min(1, "Short name is required").optional(),
    degreeType: z.enum(["BE", "BTECH", "ME", "MTECH", "MBA", "MCA"]).optional(),
    durationInSemesters: z.number().int().positive().optional(),
    departmentId: z.string().trim().min(1, "Department is required").optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional()
  })
});

export const programIdParamSchema = z.object({
  params: z.object({
    programId: z.string().trim().min(1, "Program ID is required")
  })
});