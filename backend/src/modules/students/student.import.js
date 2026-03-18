import fs from "fs";
import xlsx from "xlsx";
import { Student } from "./student.model.js";
import { Department } from "../departments/department.model.js";
import { Program } from "../programs/program.model.js";
import { Regulation } from "../regulations/regulation.model.js";
import { Batch } from "../batches/batch.model.js";
import { Semester } from "../semesters/semester.model.js";
import { ACADEMIC_STATUSES } from "../../config/constants.js";

const normalizeString = (value) => String(value ?? "").trim();
const normalizeUpper = (value) => normalizeString(value).toUpperCase();
const normalizeLower = (value) => normalizeString(value).toLowerCase();

const parseExcelDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    const parsed = xlsx.SSF.parse_date_code(value);
    if (!parsed) return null;

    return new Date(parsed.y, parsed.m - 1, parsed.d);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildLookupMaps = async () => {
  const [departments, programs, regulations, batches, semesters] = await Promise.all([
    Department.find(),
    Program.find(),
    Regulation.find(),
    Batch.find(),
    Semester.find()
  ]);

  return {
    departmentByCode: new Map(
      departments.map((item) => [normalizeUpper(item.code), item])
    ),
    programByCode: new Map(
      programs.map((item) => [normalizeUpper(item.code), item])
    ),
    regulationByCode: new Map(
      regulations.map((item) => [normalizeUpper(item.code), item])
    ),
    batchByLabel: new Map(
      batches.map((item) => [normalizeString(item.label), item])
    ),
    semesterByNumber: new Map(
      semesters.map((item) => [Number(item.number), item])
    )
  };
};

export const importStudentsFromExcel = async (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Excel file does not contain any sheet");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

  const lookup = await buildLookupMaps();

  const summary = {
    totalRows: rows.length,
    insertedCount: 0,
    skippedCount: 0,
    insertedStudents: [],
    skippedRows: []
  };

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const row = rows[index];

    try {
      const registerNumber = normalizeUpper(row.registerNumber);
      const universityRegisterNo = normalizeString(row.universityRegisterNo);
      const fullName = normalizeString(row.fullName);
      const dob = parseExcelDate(row.dob);
      const gender = normalizeUpper(row.gender);
      const mobileNo = normalizeString(row.mobileNo);
      const email = normalizeLower(row.email);

      const departmentCode = normalizeUpper(row.departmentCode);
      const programCode = normalizeUpper(row.programCode);
      const regulationCode = normalizeUpper(row.regulationCode);
      const batchLabel = normalizeString(row.batchLabel);
      const semesterNumber = Number(row.currentSemesterNumber);
      const academicStatus = normalizeUpper(row.academicStatus || "ACTIVE");
      const admissionYear = Number(row.admissionYear);

      if (!registerNumber) throw new Error("registerNumber is required");
      if (!fullName) throw new Error("fullName is required");
      if (!dob) throw new Error("Valid dob is required");
      if (!departmentCode) throw new Error("departmentCode is required");
      if (!programCode) throw new Error("programCode is required");
      if (!regulationCode) throw new Error("regulationCode is required");
      if (!batchLabel) throw new Error("batchLabel is required");
      if (!semesterNumber) throw new Error("currentSemesterNumber is required");
      if (!admissionYear) throw new Error("admissionYear is required");

      const department = lookup.departmentByCode.get(departmentCode);
      if (!department) throw new Error(`Department not found for code: ${departmentCode}`);

      const program = lookup.programByCode.get(programCode);
      if (!program) throw new Error(`Program not found for code: ${programCode}`);

      const regulation = lookup.regulationByCode.get(regulationCode);
      if (!regulation) throw new Error(`Regulation not found for code: ${regulationCode}`);

      const batch = lookup.batchByLabel.get(batchLabel);
      if (!batch) throw new Error(`Batch not found for label: ${batchLabel}`);

      const semester = lookup.semesterByNumber.get(semesterNumber);
      if (!semester) throw new Error(`Semester not found for number: ${semesterNumber}`);

      if (String(program.departmentId) !== String(department._id)) {
        throw new Error("Program does not belong to the selected department");
      }

      if (
        academicStatus &&
        !Object.values(ACADEMIC_STATUSES).includes(academicStatus)
      ) {
        throw new Error(`Invalid academicStatus: ${academicStatus}`);
      }

      const existingStudent = await Student.findOne({ registerNumber });
      if (existingStudent) {
        throw new Error(`Student with register number ${registerNumber} already exists`);
      }

      const student = await Student.create({
        registerNumber,
        universityRegisterNo,
        fullName,
        dob,
        gender,
        mobileNo,
        email,
        departmentId: department._id,
        programId: program._id,
        regulationId: regulation._id,
        batchId: batch._id,
        currentSemesterId: semester._id,
        academicStatus: academicStatus || ACADEMIC_STATUSES.ACTIVE,
        admissionYear
      });

      summary.insertedCount += 1;
      summary.insertedStudents.push({
        _id: student._id,
        registerNumber: student.registerNumber,
        fullName: student.fullName
      });
    } catch (error) {
      summary.skippedCount += 1;
      summary.skippedRows.push({
        rowNumber,
        registerNumber: row.registerNumber || "",
        reason: error.message
      });
    }
  }

  try {
    fs.unlinkSync(filePath);
  } catch {
    // ignore cleanup failure
  }

  return summary;
};