import mongoose from "mongoose";
import { MarkEntry } from "./markEntry.model.js";
import { ExamRegistration } from "../exam-registrations/examRegistration.model.js";
import { Subject } from "../subjects/subject.model.js";
import { User } from "../users/user.model.js";
import { ApiError } from "../../utils/apiError.js";
import { MARK_ENTRY_STATUSES } from "../../config/constants.js";

const ensureValidObjectId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${label} ID`);
  }
};

const ensureUserExists = async (userId, label = "user") => {
  ensureValidObjectId(userId, label);
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, `${label} not found`);
  }
  return user;
};

const populateMarkEntry = (query) =>
  query
    .populate(
      "examRegistrationId",
      "attemptType attemptNumber registrationStatus isEligible remarks",
    )
    .populate("examSessionId", "name examMonth examYear sessionCategory status")
    .populate({
      path: "studentId",
      select:
        "registerNumber fullName academicStatus programId batchId departmentId currentSemesterId",
      populate: [
        {
          path: "programId",
          select: "name code shortName degreeType status",
        },
        {
          path: "batchId",
          select: "label startYear endYear isActive",
        },
        {
          path: "departmentId",
          select: "name code shortName status",
        },
        {
          path: "currentSemesterId",
          select: "number label displayOrder isActive",
        },
      ],
    })
    .populate(
      "subjectId",
      "code name shortName subjectType credits internalMax externalMax totalMax",
    )
    .populate("enteredBy", "fullName email role")
    .populate("verifiedBy", "fullName email role")
    .populate("lockedBy", "fullName email role");

const calculateTotal = (internalMark, externalMark) => {
  return Number(internalMark || 0) + Number(externalMark || 0);
};

const validateMarksAgainstSubject = (subject, internalMark, externalMark) => {
  if (internalMark > subject.internalMax) {
    throw new ApiError(
      400,
      `Internal mark cannot exceed subject internal max (${subject.internalMax})`,
    );
  }

  if (externalMark > subject.externalMax) {
    throw new ApiError(
      400,
      `External mark cannot exceed subject external max (${subject.externalMax})`,
    );
  }
};

const ensureExamRegistrationExists = async (examRegistrationId) => {
  ensureValidObjectId(examRegistrationId, "exam registration");
  const examRegistration = await ExamRegistration.findById(examRegistrationId);
  if (!examRegistration) {
    throw new ApiError(404, "Exam registration not found");
  }
  return examRegistration;
};

const buildMarkValues = (subject, payload, fallback = {}) => {
  const internalMark =
    payload.internalMark !== undefined
      ? payload.internalMark
      : (fallback.internalMark ?? 0);
  const externalMark =
    payload.externalMark !== undefined
      ? payload.externalMark
      : (fallback.externalMark ?? 0);

  const isAbsent =
    payload.isAbsent !== undefined
      ? payload.isAbsent
      : (fallback.isAbsent ?? false);
  const isWithheld =
    payload.isWithheld !== undefined
      ? payload.isWithheld
      : (fallback.isWithheld ?? false);
  const isMalpractice =
    payload.isMalpractice !== undefined
      ? payload.isMalpractice
      : (fallback.isMalpractice ?? false);

  validateMarksAgainstSubject(subject, internalMark, externalMark);

  if (isAbsent || isWithheld || isMalpractice) {
    return {
      internalMark: 0,
      externalMark: 0,
      totalMark: 0,
      isAbsent,
      isWithheld,
      isMalpractice,
    };
  }

  return {
    internalMark,
    externalMark,
    totalMark: calculateTotal(internalMark, externalMark),
    isAbsent,
    isWithheld,
    isMalpractice,
  };
};

const getFilteredRegistrations = async ({
  examSessionId,
  programId,
  batchId,
  subjectId,
  subjectSearch,
  studentSearch,
}) => {
  ensureValidObjectId(examSessionId, "exam session");
  ensureValidObjectId(programId, "program");
  ensureValidObjectId(batchId, "batch");
  if (subjectId) {
    ensureValidObjectId(subjectId, "subject");
  }

  const registrations = await ExamRegistration.find({
    examSessionId,
    ...(subjectId ? { subjectId } : {}),
  })
    .populate({
      path: "studentId",
      select:
        "registerNumber fullName academicStatus programId batchId departmentId currentSemesterId",
      populate: [
        { path: "departmentId", select: "name shortName code" },
        { path: "currentSemesterId", select: "number label" },
        { path: "programId", select: "name shortName code" },
        { path: "batchId", select: "label startYear endYear" },
      ],
    })
    .populate(
      "subjectId",
      "code name shortName subjectType credits internalMax externalMax totalMax",
    )
    .populate("sourceSemesterId", "number label displayOrder");

  return registrations.filter((registration) => {
    const student = registration.studentId;
    const subject = registration.subjectId;
    if (!student || !subject) return false;

    const matchesProgram =
      String(student?.programId?._id || student?.programId || "") ===
      String(programId);

    const matchesBatch =
      String(student?.batchId?._id || student?.batchId || "") ===
      String(batchId);

    const subjectTerm = String(subjectSearch || "")
      .trim()
      .toLowerCase();
    const matchesSubjectSearch =
      !subjectTerm ||
      [subject?.code, subject?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(subjectTerm));

    const studentTerm = String(studentSearch || "")
      .trim()
      .toLowerCase();
    const matchesStudentSearch =
      !studentTerm ||
      [student?.registerNumber, student?.fullName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(studentTerm));

    return (
      matchesProgram &&
      matchesBatch &&
      matchesSubjectSearch &&
      matchesStudentSearch
    );
  });
};

export const createMarkEntryService = async (payload, actorUserId) => {
  await ensureUserExists(actorUserId, "entered by user");

  const examRegistration = await ensureExamRegistrationExists(
    payload.examRegistrationId,
  );

  const existingMarkEntry = await MarkEntry.findOne({
    examRegistrationId: payload.examRegistrationId,
  });

  if (existingMarkEntry) {
    throw new ApiError(
      409,
      "Mark entry already exists for this exam registration",
    );
  }

  const subject = await Subject.findById(examRegistration.subjectId);
  if (!subject) {
    throw new ApiError(404, "Subject not found for exam registration");
  }

  const values = buildMarkValues(subject, payload);

  const markEntry = await MarkEntry.create({
    examRegistrationId: examRegistration._id,
    examSessionId: examRegistration.examSessionId,
    studentId: examRegistration.studentId,
    subjectId: examRegistration.subjectId,
    internalMark: values.internalMark,
    externalMark: values.externalMark,
    totalMark: values.totalMark,
    isAbsent: values.isAbsent,
    isWithheld: values.isWithheld,
    isMalpractice: values.isMalpractice,
    entryStatus: MARK_ENTRY_STATUSES.DRAFT,
    enteredBy: actorUserId,
    version: 1,
  });

  return populateMarkEntry(MarkEntry.findById(markEntry._id));
};

export const getMarkImportSubjectsService = async ({
  examSessionId,
  programId,
  batchId,
  subjectSearch,
}) => {
  const registrations = await getFilteredRegistrations({
    examSessionId,
    programId,
    batchId,
    subjectSearch,
  });

  const uniqueSubjectsMap = new Map();

  registrations.forEach((registration) => {
    const subject = registration.subjectId;
    if (!subject) return;

    const key = String(subject._id);
    if (!uniqueSubjectsMap.has(key)) {
      uniqueSubjectsMap.set(key, {
        _id: subject._id,
        code: subject.code,
        name: subject.name,
        internalMax: subject.internalMax ?? 0,
        externalMax: subject.externalMax ?? 0,
        totalMax: subject.totalMax ?? 0,
        registeredCount: 0,
      });
    }

    uniqueSubjectsMap.get(key).registeredCount += 1;
  });

  return Array.from(uniqueSubjectsMap.values()).sort((a, b) =>
    `${a.code} ${a.name}`.localeCompare(`${b.code} ${b.name}`),
  );
};

export const getMarkImportCandidatesService = async ({
  examSessionId,
  programId,
  batchId,
  subjectId,
}) => {
  const registrations = await getFilteredRegistrations({
    examSessionId,
    programId,
    batchId,
    subjectId,
  });

  const existingEntries = await MarkEntry.find({
    examRegistrationId: { $in: registrations.map((item) => item._id) },
  });

  const existingMap = new Map(
    existingEntries.map((entry) => [String(entry.examRegistrationId), entry]),
  );

  return registrations
    .sort((a, b) =>
      String(a?.studentId?.registerNumber || "").localeCompare(
        String(b?.studentId?.registerNumber || ""),
      ),
    )
    .map((registration) => {
      const student = registration.studentId;
      const subject = registration.subjectId;
      const entry = existingMap.get(String(registration._id));

      return {
        examRegistrationId: registration._id,
        markEntryId: entry?._id || null,
        registerNumber: student?.registerNumber || "-",
        fullName: student?.fullName || "-",
        subjectCode: subject?.code || "-",
        subjectName: subject?.name || "-",
        internalMax: subject?.internalMax ?? 0,
        externalMax: subject?.externalMax ?? 0,
        totalMax: subject?.totalMax ?? 0,
        internalMark: entry?.internalMark ?? null,
        externalMark: entry?.externalMark ?? null,
        totalMark: entry?.totalMark ?? null,
        isAbsent: entry?.isAbsent ?? false,
        isWithheld: entry?.isWithheld ?? false,
        isMalpractice: entry?.isMalpractice ?? false,
        entryStatus: entry?.entryStatus || "NOT_CREATED",
      };
    });
};

export const bulkImportMarkEntriesService = async (
  { examSessionId, programId, batchId, subjectId, rows },
  actorUserId,
) => {
  await ensureUserExists(actorUserId, "entered by user");

  const registrations = await getFilteredRegistrations({
    examSessionId,
    programId,
    batchId,
    subjectId,
  });

  const registrationMap = new Map();
  registrations.forEach((registration) => {
    const registerNumber = String(registration?.studentId?.registerNumber || "")
      .trim()
      .toUpperCase();
    const subjectCode = String(registration?.subjectId?.code || "")
      .trim()
      .toUpperCase();
    registrationMap.set(`${registerNumber}__${subjectCode}`, registration);
  });

  const summary = {
    totalRows: rows.length,
    savedCount: 0,
    createdCount: 0,
    updatedCount: 0,
    failedRows: [],
  };

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];

    try {
      const registerNumber = String(row.registerNumber || "")
        .trim()
        .toUpperCase();
      const subjectCode = String(row.subjectCode || "")
        .trim()
        .toUpperCase();

      if (!registerNumber) {
        throw new ApiError(400, "Register number is required");
      }

      if (!subjectCode) {
        throw new ApiError(400, "Subject code is required");
      }

      const registration = registrationMap.get(
        `${registerNumber}__${subjectCode}`,
      );
      if (!registration) {
        throw new ApiError(
          404,
          "Matching registered student/subject not found",
        );
      }

      const subject = registration.subjectId;
      const internalMark =
        row.internalMark !== undefined && row.internalMark !== null
          ? Number(row.internalMark)
          : 0;
      const externalMark =
        row.externalMark !== undefined && row.externalMark !== null
          ? Number(row.externalMark)
          : 0;

      const absent = Boolean(row.absent);
      const withheld = Boolean(row.withheld);
      const malpractice = Boolean(row.malpractice);

      const expectedTotal =
        absent || withheld || malpractice ? 0 : internalMark + externalMark;

      if (
        row.total !== undefined &&
        row.total !== null &&
        Number(row.total) !== expectedTotal
      ) {
        throw new ApiError(400, "Total does not match internal + external");
      }

      const existingEntry = await MarkEntry.findOne({
        examRegistrationId: registration._id,
      });

      const values = buildMarkValues(
        subject,
        {
          internalMark,
          externalMark,
          isAbsent: absent,
          isWithheld: withheld,
          isMalpractice: malpractice,
        },
        existingEntry || {},
      );

      if (!existingEntry) {
        await MarkEntry.create({
          examRegistrationId: registration._id,
          examSessionId: registration.examSessionId,
          studentId: registration.studentId._id || registration.studentId,
          subjectId: registration.subjectId._id || registration.subjectId,
          internalMark: values.internalMark,
          externalMark: values.externalMark,
          totalMark: values.totalMark,
          isAbsent: values.isAbsent,
          isWithheld: values.isWithheld,
          isMalpractice: values.isMalpractice,
          entryStatus: MARK_ENTRY_STATUSES.DRAFT,
          enteredBy: actorUserId,
          version: 1,
        });

        summary.savedCount += 1;
        summary.createdCount += 1;
        continue;
      }

      if (existingEntry.entryStatus === MARK_ENTRY_STATUSES.LOCKED) {
        throw new ApiError(400, "Locked mark entry cannot be updated");
      }

      existingEntry.internalMark = values.internalMark;
      existingEntry.externalMark = values.externalMark;
      existingEntry.totalMark = values.totalMark;
      existingEntry.isAbsent = values.isAbsent;
      existingEntry.isWithheld = values.isWithheld;
      existingEntry.isMalpractice = values.isMalpractice;
      existingEntry.entryStatus = MARK_ENTRY_STATUSES.DRAFT;
      existingEntry.version += 1;

      await existingEntry.save();

      summary.savedCount += 1;
      summary.updatedCount += 1;
    } catch (error) {
      summary.failedRows.push({
        rowNumber: index + 1,
        registerNumber: row.registerNumber || "",
        subjectCode: row.subjectCode || "",
        reason: error.message,
      });
    }
  }

  return summary;
};

export const getMarkEntryCandidatesService = async ({
  examSessionId,
  programId,
  batchId,
  studentSearch,
}) => {
  const registrations = await getFilteredRegistrations({
    examSessionId,
    programId,
    batchId,
    studentSearch,
  });

  const existingEntries = await MarkEntry.find({
    examRegistrationId: { $in: registrations.map((item) => item._id) },
  });

  const existingEntryMap = new Map(
    existingEntries.map((entry) => [String(entry.examRegistrationId), entry]),
  );

  return registrations.map((registration) => {
    const student = registration.studentId;
    const subject = registration.subjectId;
    const sourceSemester = registration.sourceSemesterId;
    const existingEntry = existingEntryMap.get(String(registration._id));

    return {
      examRegistrationId: registration._id,
      markEntryId: existingEntry?._id || null,
      entryStatus: existingEntry?.entryStatus || "NOT_CREATED",
      registerNumber: student?.registerNumber || "-",
      fullName: student?.fullName || "-",
      departmentName:
        student?.departmentId?.name ||
        student?.departmentId?.shortName ||
        student?.departmentId?.code ||
        "-",
      currentSemesterLabel:
        student?.currentSemesterId?.label ||
        `Semester ${student?.currentSemesterId?.number || "-"}`,
      subjectCode: subject?.code || "-",
      subjectName: subject?.name || "-",
      sourceSemesterLabel: sourceSemester?.label || "-",
      attemptType: registration?.attemptType || "-",
      attemptNumber: registration?.attemptNumber || 1,
      internalMax: subject?.internalMax ?? 0,
      externalMax: subject?.externalMax ?? 0,
      totalMax: subject?.totalMax ?? 0,
      internalMark: existingEntry?.internalMark ?? null,
      externalMark: existingEntry?.externalMark ?? null,
      totalMark: existingEntry?.totalMark ?? null,
      isAbsent: existingEntry?.isAbsent ?? false,
      isWithheld: existingEntry?.isWithheld ?? false,
      isMalpractice: existingEntry?.isMalpractice ?? false,
    };
  });
};

export const bulkUpsertMarkEntriesService = async (
  { entries },
  actorUserId,
) => {
  await ensureUserExists(actorUserId, "entered by user");

  const summary = {
    savedCount: 0,
    createdCount: 0,
    updatedCount: 0,
    failedRows: [],
  };

  for (const row of entries) {
    try {
      const examRegistration = await ensureExamRegistrationExists(
        row.examRegistrationId,
      );

      const subject = await Subject.findById(examRegistration.subjectId);
      if (!subject) {
        throw new ApiError(404, "Subject not found for exam registration");
      }

      const existingEntry = await MarkEntry.findOne({
        examRegistrationId: row.examRegistrationId,
      });

      if (!existingEntry) {
        const values = buildMarkValues(subject, row);

        await MarkEntry.create({
          examRegistrationId: examRegistration._id,
          examSessionId: examRegistration.examSessionId,
          studentId: examRegistration.studentId,
          subjectId: examRegistration.subjectId,
          internalMark: values.internalMark,
          externalMark: values.externalMark,
          totalMark: values.totalMark,
          isAbsent: values.isAbsent,
          isWithheld: values.isWithheld,
          isMalpractice: values.isMalpractice,
          entryStatus: MARK_ENTRY_STATUSES.DRAFT,
          enteredBy: actorUserId,
          version: 1,
        });

        summary.savedCount += 1;
        summary.createdCount += 1;
        continue;
      }

      if (existingEntry.entryStatus === MARK_ENTRY_STATUSES.LOCKED) {
        throw new ApiError(400, "Locked mark entry cannot be updated");
      }

      const values = buildMarkValues(subject, row, existingEntry);

      existingEntry.internalMark = values.internalMark;
      existingEntry.externalMark = values.externalMark;
      existingEntry.totalMark = values.totalMark;
      existingEntry.isAbsent = values.isAbsent;
      existingEntry.isWithheld = values.isWithheld;
      existingEntry.isMalpractice = values.isMalpractice;
      existingEntry.entryStatus = MARK_ENTRY_STATUSES.DRAFT;
      existingEntry.version += 1;

      await existingEntry.save();

      summary.savedCount += 1;
      summary.updatedCount += 1;
    } catch (error) {
      summary.failedRows.push({
        examRegistrationId: row.examRegistrationId,
        reason: error.message,
      });
    }
  }

  return summary;
};

export const getAllMarkEntriesService = async () => {
  return populateMarkEntry(MarkEntry.find().sort({ createdAt: -1 }));
};

export const getMarkEntryByIdService = async (markEntryId) => {
  ensureValidObjectId(markEntryId, "mark entry");

  const markEntry = await populateMarkEntry(MarkEntry.findById(markEntryId));

  if (!markEntry) {
    throw new ApiError(404, "Mark entry not found");
  }

  return markEntry;
};

export const updateMarkEntryService = async (markEntryId, payload) => {
  ensureValidObjectId(markEntryId, "mark entry");

  const markEntry = await MarkEntry.findById(markEntryId);

  if (!markEntry) {
    throw new ApiError(404, "Mark entry not found");
  }

  if (markEntry.entryStatus === MARK_ENTRY_STATUSES.LOCKED) {
    throw new ApiError(400, "Locked mark entry cannot be updated");
  }

  const subject = await Subject.findById(markEntry.subjectId);
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  const values = buildMarkValues(subject, payload, markEntry);

  markEntry.internalMark = values.internalMark;
  markEntry.externalMark = values.externalMark;
  markEntry.totalMark = values.totalMark;
  markEntry.isAbsent = values.isAbsent;
  markEntry.isWithheld = values.isWithheld;
  markEntry.isMalpractice = values.isMalpractice;
  markEntry.version += 1;

  await markEntry.save();

  return populateMarkEntry(MarkEntry.findById(markEntry._id));
};

export const verifyMarkEntryService = async (markEntryId, actorUserId) => {
  ensureValidObjectId(markEntryId, "mark entry");
  await ensureUserExists(actorUserId, "verified by user");

  const markEntry = await MarkEntry.findById(markEntryId);

  if (!markEntry) {
    throw new ApiError(404, "Mark entry not found");
  }

  if (markEntry.entryStatus === MARK_ENTRY_STATUSES.LOCKED) {
    throw new ApiError(400, "Locked mark entry cannot be verified again");
  }

  markEntry.entryStatus = MARK_ENTRY_STATUSES.VERIFIED;
  markEntry.verifiedBy = actorUserId;

  await markEntry.save();

  return populateMarkEntry(MarkEntry.findById(markEntry._id));
};

export const lockMarkEntryService = async (markEntryId, actorUserId) => {
  ensureValidObjectId(markEntryId, "mark entry");
  await ensureUserExists(actorUserId, "locked by user");

  const markEntry = await MarkEntry.findById(markEntryId);

  if (!markEntry) {
    throw new ApiError(404, "Mark entry not found");
  }

  if (markEntry.entryStatus !== MARK_ENTRY_STATUSES.VERIFIED) {
    throw new ApiError(400, "Only verified mark entries can be locked");
  }

  markEntry.entryStatus = MARK_ENTRY_STATUSES.LOCKED;
  markEntry.lockedBy = actorUserId;

  await markEntry.save();

  return populateMarkEntry(MarkEntry.findById(markEntry._id));
};
