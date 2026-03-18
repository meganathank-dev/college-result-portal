import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import Modal from "../../components/common/Modal";
import { getBatchesApi } from "../../api/batches.api";
import { getProgramsApi } from "../../api/programs.api";
import { getRegulationsApi } from "../../api/regulations.api";
import { getSemestersApi } from "../../api/semesters.api";
import {
  getStudentsApi,
  createStudentApi,
  updateStudentApi
} from "../../api/students.api";

const GENDERS = ["MALE", "FEMALE", "OTHER"];
const ACADEMIC_STATUSES = ["ACTIVE", "INACTIVE", "DISCONTINUED", "COMPLETED"];

const emptyForm = {
  registerNumber: "",
  rollNo: "",
  fullName: "",
  gender: "MALE",
  dob: "",
  mobileNo: "",
  email: "",
  batchId: "",
  programId: "",
  regulationId: "",
  currentSemesterId: "",
  academicStatus: "ACTIVE"
};

function StatusBadge({ isActive, status, academicStatus }) {
  const resolvedValue = String(
    status || academicStatus || (isActive ? "ACTIVE" : "INACTIVE")
  )
    .toUpperCase()
    .trim();

  const activeLike = resolvedValue === "ACTIVE";

  const styles = activeLike
    ? "bg-[#EEF8F1] text-[#3F7D56] border-[#D6EFD9]"
    : "bg-[#FFF4E8] text-[#9A6A2A] border-[#F1DEC2]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles}`}>
      {resolvedValue || "ACTIVE"}
    </span>
  );
}

function GenderBadge({ value }) {
  return (
    <span className="inline-flex rounded-full border border-[#DCE7F7] bg-[#EDF3FA] px-3 py-1 text-xs font-medium text-[#4A6A94]">
      {value || "-"}
    </span>
  );
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-2 block text-sm font-medium text-[#243447]">
      {children}
      {required ? <span className="ml-1 text-[#C66B5D]">*</span> : null}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-[#E2EAF2] bg-white px-4 py-3 text-[15px] text-[#243447] outline-none transition placeholder:text-[#9AA8B8] focus:border-[#7C9CCF] focus:ring-4 focus:ring-[#7C9CCF]/10";

const resolveBatchId = (student) =>
  String(student.batchId?._id || student.batchId || student.batch || "");

const resolveBatchLabel = (student, batchMap) => {
  if (student.batchId?.label) return student.batchId.label;
  const batch = batchMap.get(resolveBatchId(student));
  return batch?.label || "-";
};

const resolveProgramId = (student) =>
  String(student.programId?._id || student.programId || student.program || "");

const resolveProgramName = (student, programMap) => {
  if (student.programId?.name) return student.programId.name;
  const program = programMap.get(resolveProgramId(student));
  return program?.name || "-";
};

const resolveRegulationId = (student) =>
  String(student.regulationId?._id || student.regulationId || student.regulation || "");

const resolveRegulationName = (student, regulationMap) => {
  if (student.regulationId?.name) return student.regulationId.name;
  const regulation = regulationMap.get(resolveRegulationId(student));
  return regulation?.name || regulation?.code || "-";
};

const resolveSemesterId = (student) =>
  String(
    student.currentSemesterId?._id ||
      student.currentSemesterId ||
      student.semesterId?._id ||
      student.semesterId ||
      ""
  );

const resolveSemesterLabel = (student, semesterMap) => {
  if (student.currentSemesterId?.label) return student.currentSemesterId.label;
  if (student.semesterId?.label) return student.semesterId.label;
  const semester = semesterMap.get(resolveSemesterId(student));
  return semester?.label || "-";
};

const resolveRegisterNumber = (student) =>
  student.registerNumber || student.regNo || student.registrationNumber || "-";

const resolveRollNo = (student) => student.universityRegisterNo || student.rollNo || "";

const resolveFullName = (student) =>
  student.fullName || student.name || student.studentName || "-";

const normalizeGender = (value) => {
  const gender = String(value || "").toUpperCase().trim();
  if (GENDERS.includes(gender)) return gender;
  return "MALE";
};

const resolveGender = (student) => normalizeGender(student.gender);

const resolveDob = (student) => {
  const raw = student.dob || student.dateOfBirth || null;
  if (!raw) return "-";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "-";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const extractErrorMessage = (err) => {
  const data = err?.response?.data;

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    if (typeof first === "string") return first;
    if (first?.message) return first.message;
  }

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }

  return "Validation failed";
};

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [regulationFilter, setRegulationFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError("");

      const [
        studentResponse,
        batchResponse,
        programResponse,
        regulationResponse,
        semesterResponse
      ] = await Promise.all([
        getStudentsApi(),
        getBatchesApi(),
        getProgramsApi(),
        getRegulationsApi(),
        getSemestersApi()
      ]);

      setStudents(studentResponse?.data || []);
      setBatches(batchResponse?.data || []);
      setPrograms(programResponse?.data || []);
      setRegulations(regulationResponse?.data || []);
      setSemesters(semesterResponse?.data || []);
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const batchMap = useMemo(() => {
    const map = new Map();
    batches.forEach((item) => map.set(String(item._id), item));
    return map;
  }, [batches]);

  const programMap = useMemo(() => {
    const map = new Map();
    programs.forEach((item) => map.set(String(item._id), item));
    return map;
  }, [programs]);

  const regulationMap = useMemo(() => {
    const map = new Map();
    regulations.forEach((item) => map.set(String(item._id), item));
    return map;
  }, [regulations]);

  const semesterMap = useMemo(() => {
    const map = new Map();
    semesters.forEach((item) => map.set(String(item._id), item));
    return map;
  }, [semesters]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !term ||
        [
          resolveRegisterNumber(student),
          resolveRollNo(student),
          resolveFullName(student),
          resolveGender(student),
          resolveBatchLabel(student, batchMap),
          resolveProgramName(student, programMap),
          resolveRegulationName(student, regulationMap),
          resolveSemesterLabel(student, semesterMap)
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesBatch = !batchFilter || resolveBatchId(student) === String(batchFilter);
      const matchesProgram = !programFilter || resolveProgramId(student) === String(programFilter);
      const matchesRegulation =
        !regulationFilter || resolveRegulationId(student) === String(regulationFilter);

      return matchesSearch && matchesBatch && matchesProgram && matchesRegulation;
    });
  }, [
    students,
    search,
    batchFilter,
    programFilter,
    regulationFilter,
    batchMap,
    programMap,
    regulationMap,
    semesterMap
  ]);

  const openCreateModal = () => {
    setEditingStudent(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setForm({
      registerNumber:
        student.registerNumber || student.regNo || student.registrationNumber || "",
      rollNo: student.universityRegisterNo || student.rollNo || "",
      fullName: student.fullName || student.name || student.studentName || "",
      gender: normalizeGender(student.gender),
      dob: toDateInputValue(student.dob || student.dateOfBirth),
      mobileNo: student.mobileNo || "",
      email: student.email || "",
      batchId: resolveBatchId(student),
      programId: resolveProgramId(student),
      regulationId: resolveRegulationId(student),
      currentSemesterId: resolveSemesterId(student),
      academicStatus: String(student.academicStatus || "ACTIVE").toUpperCase()
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingStudent(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const getDerivedDepartmentId = (programId, fallbackStudent) => {
    const selectedProgram = programs.find(
      (program) => String(program._id) === String(programId)
    );

    const fromProgram =
      selectedProgram?.departmentId?._id || selectedProgram?.departmentId || "";

    if (fromProgram) return String(fromProgram);

    const fromStudent =
      fallbackStudent?.departmentId?._id ||
      fallbackStudent?.departmentId ||
      fallbackStudent?.department ||
      "";

    return String(fromStudent || "");
  };

  const getAdmissionYear = (batchId) => {
    const selectedBatch = batches.find((batch) => String(batch._id) === String(batchId));
    return selectedBatch?.startYear ?? null;
  };

  const validateForm = () => {
    if (!form.registerNumber.trim()) return "Register number is required";
    if (!form.fullName.trim()) return "Student name is required";
    if (!form.dob) return "Date of birth is required";
    if (!form.batchId) return "Batch is required";
    if (!form.programId) return "Program is required";
    if (!form.regulationId) return "Regulation is required";
    if (!form.currentSemesterId) return "Current semester is required";

    const departmentId = getDerivedDepartmentId(form.programId, editingStudent);
    if (!departmentId) return "Selected program is not linked to a department";

    const admissionYear = getAdmissionYear(form.batchId);
    if (!admissionYear) return "Selected batch is missing admission year";

    return "";
  };

  const buildPayload = () => {
    const departmentId = getDerivedDepartmentId(form.programId, editingStudent);
    const admissionYear = getAdmissionYear(form.batchId);
    const dobIso = new Date(`${form.dob}T00:00:00.000Z`).toISOString();

    return {
      registerNumber: form.registerNumber.trim().toUpperCase(),
      universityRegisterNo: form.rollNo.trim(),
      fullName: form.fullName.trim(),
      dob: dobIso,
      gender: form.gender,
      mobileNo: form.mobileNo.trim(),
      email: form.email.trim(),
      departmentId,
      batchId: form.batchId,
      programId: form.programId,
      regulationId: form.regulationId,
      currentSemesterId: form.currentSemesterId,
      academicStatus: form.academicStatus,
      admissionYear
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = buildPayload();

      if (editingStudent?._id) {
        await updateStudentApi(editingStudent._id, payload);
      } else {
        await createStudentApi(payload);
      }

      await loadData();
      closeModal();
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        subtitle="Manage student master records and academic linkage"
        action={
          <button
            onClick={openCreateModal}
            className="rounded-2xl bg-[#7C9CCF] px-4 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF]"
          >
            Add Student
          </button>
        }
      />

      <SectionCard
        title="Student Directory"
        subtitle="Manage student records"
        action={
          <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
            <select
              value={batchFilter}
              onChange={(event) => setBatchFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">All Batches</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.label || batch.batchLabel}
                </option>
              ))}
            </select>

            <select
              value={programFilter}
              onChange={(event) => setProgramFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">All Programs</option>
              {programs.map((program) => (
                <option key={program._id} value={program._id}>
                  {program.name}
                </option>
              ))}
            </select>

            <select
              value={regulationFilter}
              onChange={(event) => setRegulationFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">All Regulations</option>
              {regulations.map((regulation) => (
                <option key={regulation._id} value={regulation._id}>
                  {regulation.name || regulation.code}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students..."
              className={`xl:w-72 ${inputClass}`}
            />
          </div>
        }
      >
        {loading ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            Loading students...
          </div>
        ) : pageError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {pageError}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            No students found.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="min-w-full text-sm">
                <thead className="bg-[#EDF3FA] text-[#243447]">
                  <tr>
                    <th className="px-4 py-3 text-left">Register No</th>
                    <th className="px-4 py-3 text-left">Roll No</th>
                    <th className="px-4 py-3 text-left">Student Name</th>
                    <th className="px-4 py-3 text-left">Gender</th>
                    <th className="px-4 py-3 text-left">Date of Birth</th>
                    <th className="px-4 py-3 text-left">Batch</th>
                    <th className="px-4 py-3 text-left">Program</th>
                    <th className="px-4 py-3 text-left">Regulation</th>
                    <th className="px-4 py-3 text-left">Semester</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="border-t border-[#E6ECF2]">
                      <td className="px-4 py-4 font-medium text-[#243447]">
                        {resolveRegisterNumber(student)}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">{resolveRollNo(student) || "-"}</td>
                      <td className="px-4 py-4 text-[#243447]">{resolveFullName(student)}</td>
                      <td className="px-4 py-4">
                        <GenderBadge value={resolveGender(student)} />
                      </td>
                      <td className="px-4 py-4 text-[#243447]">{resolveDob(student)}</td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveBatchLabel(student, batchMap)}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveProgramName(student, programMap)}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveRegulationName(student, regulationMap)}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveSemesterLabel(student, semesterMap)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          status={student.status}
                          academicStatus={student.academicStatus}
                          isActive={student.isActive}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => openEditModal(student)}
                          className="rounded-xl border border-[#E6ECF2] px-3 py-2 text-sm font-medium text-[#4A6A94] hover:bg-[#F8FAFC]"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 xl:hidden">
              {filteredStudents.map((student) => (
                <div
                  key={student._id}
                  className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-base font-semibold text-[#243447]">
                        {resolveFullName(student)}
                      </h4>
                      <p className="mt-1 text-sm text-[#6B7A8C]">{resolveRegisterNumber(student)}</p>
                    </div>

                    <StatusBadge
                      status={student.status}
                      academicStatus={student.academicStatus}
                      isActive={student.isActive}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <GenderBadge value={resolveGender(student)} />
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-[#243447]">
                    <p><span className="font-medium">Roll No:</span> {resolveRollNo(student) || "-"}</p>
                    <p><span className="font-medium">Date of Birth:</span> {resolveDob(student)}</p>
                    <p><span className="font-medium">Batch:</span> {resolveBatchLabel(student, batchMap)}</p>
                    <p><span className="font-medium">Program:</span> {resolveProgramName(student, programMap)}</p>
                    <p><span className="font-medium">Regulation:</span> {resolveRegulationName(student, regulationMap)}</p>
                    <p><span className="font-medium">Semester:</span> {resolveSemesterLabel(student, semesterMap)}</p>
                  </div>

                  <button
                    onClick={() => openEditModal(student)}
                    className="mt-4 rounded-xl border border-[#E6ECF2] px-3 py-2 text-sm font-medium text-[#4A6A94] hover:bg-white"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      <Modal open={modalOpen} onClose={closeModal} title={editingStudent ? "Edit Student" : "Add Student"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <FieldLabel required>Register Number</FieldLabel>
              <input
                type="text"
                name="registerNumber"
                value={form.registerNumber}
                onChange={handleFormChange}
                placeholder="23CSE001"
                className={inputClass}
              />
            </div>

            <div>
              <FieldLabel>Roll No</FieldLabel>
              <input
                type="text"
                name="rollNo"
                value={form.rollNo}
                onChange={handleFormChange}
                placeholder="U23CSE001"
                className={inputClass}
              />
            </div>

            <div>
              <FieldLabel required>Student Name</FieldLabel>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleFormChange}
                placeholder="Arun Kumar"
                className={inputClass}
              />
            </div>

            <div>
              <FieldLabel required>Gender</FieldLabel>
              <select name="gender" value={form.gender} onChange={handleFormChange} className={inputClass}>
                {GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel required>Date of Birth</FieldLabel>
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleFormChange}
                className={inputClass}
              />
            </div>

            <div>
              <FieldLabel>Mobile No</FieldLabel>
              <input
                type="text"
                name="mobileNo"
                value={form.mobileNo}
                onChange={handleFormChange}
                placeholder="9876543210"
                className={inputClass}
              />
            </div>

            <div className="lg:col-span-3">
              <FieldLabel>Email</FieldLabel>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleFormChange}
                placeholder="student@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <FieldLabel required>Batch</FieldLabel>
              <select name="batchId" value={form.batchId} onChange={handleFormChange} className={inputClass}>
                <option value="">Select Batch</option>
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.label || batch.batchLabel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel required>Program</FieldLabel>
              <select name="programId" value={form.programId} onChange={handleFormChange} className={inputClass}>
                <option value="">Select Program</option>
                {programs.map((program) => (
                  <option key={program._id} value={program._id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel required>Regulation</FieldLabel>
              <select
                name="regulationId"
                value={form.regulationId}
                onChange={handleFormChange}
                className={inputClass}
              >
                <option value="">Select Regulation</option>
                {regulations.map((regulation) => (
                  <option key={regulation._id} value={regulation._id}>
                    {regulation.name || regulation.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel required>Current Semester</FieldLabel>
              <select
                name="currentSemesterId"
                value={form.currentSemesterId}
                onChange={handleFormChange}
                className={inputClass}
              >
                <option value="">Select Semester</option>
                {semesters.map((semester) => (
                  <option key={semester._id} value={semester._id}>
                    {semester.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel required>Academic Status</FieldLabel>
              <select
                name="academicStatus"
                value={form.academicStatus}
                onChange={handleFormChange}
                className={inputClass}
              >
                {ACADEMIC_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <div className="sticky bottom-0 flex flex-col gap-3 border-t border-[#EEF2F6] bg-white pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-2xl border border-[#E6ECF2] px-5 py-3 text-sm font-medium text-[#4A6A94] transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-[#7C9CCF] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#5F7FAF] disabled:opacity-70"
            >
              {saving ? "Saving..." : editingStudent ? "Update Student" : "Create Student"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}