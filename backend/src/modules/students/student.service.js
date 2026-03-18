import mongoose from "mongoose";
import { Student } from "./student.model.js";
import { Department } from "../departments/department.model.js";
import { Program } from "../programs/program.model.js";
import { Regulation } from "../regulations/regulation.model.js";
import { Batch } from "../batches/batch.model.js";
import { Semester } from "../semesters/semester.model.js";
import { ApiError } from "../../utils/apiError.js";
import { ACADEMIC_STATUSES } from "../../config/constants.js";

const ensureValidObjectId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${label} ID`);
  }
};

const ensureDepartmentExists = async (departmentId) => {
  ensureValidObjectId(departmentId, "department");
  const department = await Department.findById(departmentId);
  if (!department) throw new ApiError(404, "Department not found");
  return department;
};

const ensureProgramExists = async (programId) => {
  ensureValidObjectId(programId, "program");
  const program = await Program.findById(programId);
  if (!program) throw new ApiError(404, "Program not found");
  return program;
};

const ensureRegulationExists = async (regulationId) => {
  ensureValidObjectId(regulationId, "regulation");
  const regulation = await Regulation.findById(regulationId);
  if (!regulation) throw new ApiError(404, "Regulation not found");
  return regulation;
};

const ensureBatchExists = async (batchId) => {
  ensureValidObjectId(batchId, "batch");
  const batch = await Batch.findById(batchId);
  if (!batch) throw new ApiError(404, "Batch not found");
  return batch;
};

const ensureSemesterExists = async (semesterId) => {
  ensureValidObjectId(semesterId, "semester");
  const semester = await Semester.findById(semesterId);
  if (!semester) throw new ApiError(404, "Semester not found");
  return semester;
};

const populateStudent = (query) =>
  query
    .populate("departmentId", "code name shortName status")
    .populate("programId", "code name degreeType durationInSemesters status departmentId")
    .populate("regulationId", "code name effectiveFromBatchYear effectiveToBatchYear isActive")
    .populate("batchId", "label startYear endYear isActive")
    .populate("currentSemesterId", "number label displayOrder isActive");

const validateStudentLinks = async ({
  departmentId,
  programId,
  regulationId,
  batchId,
  currentSemesterId
}) => {
  const [department, program] = await Promise.all([
    ensureDepartmentExists(departmentId),
    ensureProgramExists(programId),
    ensureRegulationExists(regulationId),
    ensureBatchExists(batchId),
    ensureSemesterExists(currentSemesterId)
  ]);

  if (String(program.departmentId) !== String(department._id)) {
    throw new ApiError(400, "Selected program does not belong to the selected department");
  }
};

export const createStudentService = async (payload) => {
  const existingStudent = await Student.findOne({
    registerNumber: payload.registerNumber.toUpperCase()
  });

  if (existingStudent) {
    throw new ApiError(409, "Register number already exists");
  }

  await validateStudentLinks(payload);

  const student = await Student.create({
    registerNumber: payload.registerNumber.toUpperCase(),
    universityRegisterNo: payload.universityRegisterNo?.trim() || "",
    fullName: payload.fullName.trim(),
    dob: new Date(payload.dob),
    gender: payload.gender?.trim()?.toUpperCase() || "",
    mobileNo: payload.mobileNo?.trim() || "",
    email: payload.email?.trim()?.toLowerCase() || "",
    departmentId: payload.departmentId,
    programId: payload.programId,
    regulationId: payload.regulationId,
    batchId: payload.batchId,
    currentSemesterId: payload.currentSemesterId,
    academicStatus: payload.academicStatus || ACADEMIC_STATUSES.ACTIVE,
    admissionYear: payload.admissionYear
  });

  return populateStudent(Student.findById(student._id));
};

export const getAllStudentsService = async () => {
  return populateStudent(
    Student.find().sort({ createdAt: -1 })
  );
};

export const getStudentByIdService = async (studentId) => {
  ensureValidObjectId(studentId, "student");

  const student = await populateStudent(Student.findById(studentId));

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  return student;
};

export const updateStudentService = async (studentId, payload) => {
  ensureValidObjectId(studentId, "student");

  const student = await Student.findById(studentId);

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const updatedValues = {
    registerNumber: payload.registerNumber ?? student.registerNumber,
    universityRegisterNo:
      payload.universityRegisterNo !== undefined
        ? payload.universityRegisterNo
        : student.universityRegisterNo,
    fullName: payload.fullName ?? student.fullName,
    dob: payload.dob ?? student.dob,
    gender: payload.gender !== undefined ? payload.gender : student.gender,
    mobileNo: payload.mobileNo !== undefined ? payload.mobileNo : student.mobileNo,
    email: payload.email !== undefined ? payload.email : student.email,
    departmentId: payload.departmentId ?? String(student.departmentId),
    programId: payload.programId ?? String(student.programId),
    regulationId: payload.regulationId ?? String(student.regulationId),
    batchId: payload.batchId ?? String(student.batchId),
    currentSemesterId: payload.currentSemesterId ?? String(student.currentSemesterId),
    academicStatus: payload.academicStatus ?? student.academicStatus,
    admissionYear: payload.admissionYear ?? student.admissionYear
  };

  const existingStudent = await Student.findOne({
    registerNumber: updatedValues.registerNumber.toUpperCase(),
    _id: { $ne: studentId }
  });

  if (existingStudent) {
    throw new ApiError(409, "Register number already exists");
  }

  await validateStudentLinks(updatedValues);

  student.registerNumber = updatedValues.registerNumber.toUpperCase();
  student.universityRegisterNo = updatedValues.universityRegisterNo?.trim() || "";
  student.fullName = updatedValues.fullName.trim();
  student.dob = new Date(updatedValues.dob);
  student.gender = updatedValues.gender?.trim()?.toUpperCase() || "";
  student.mobileNo = updatedValues.mobileNo?.trim() || "";
  student.email = updatedValues.email?.trim()?.toLowerCase() || "";
  student.departmentId = updatedValues.departmentId;
  student.programId = updatedValues.programId;
  student.regulationId = updatedValues.regulationId;
  student.batchId = updatedValues.batchId;
  student.currentSemesterId = updatedValues.currentSemesterId;
  student.academicStatus = updatedValues.academicStatus;
  student.admissionYear = updatedValues.admissionYear;

  await student.save();

  return populateStudent(Student.findById(student._id));
};

export const toggleStudentAcademicStatusService = async (studentId) => {
  ensureValidObjectId(studentId, "student");

  const student = await Student.findById(studentId);

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  student.academicStatus =
    student.academicStatus === ACADEMIC_STATUSES.ACTIVE
      ? ACADEMIC_STATUSES.DISCONTINUED
      : ACADEMIC_STATUSES.ACTIVE;

  await student.save();

  return populateStudent(Student.findById(student._id));
};