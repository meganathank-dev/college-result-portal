import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import Modal from "../../components/common/Modal";
import { getExamSessionsApi } from "../../api/examSessions.api";
import { getStudentsApi } from "../../api/students.api";
import { getSubjectsApi } from "../../api/subjects.api";
import { getSemestersApi } from "../../api/semesters.api";
import { getProgramsApi } from "../../api/programs.api";
import { getBatchesApi } from "../../api/batches.api";
import {
  autoSyncCurrentExamRegistrationsApi,
  createExamRegistrationApi,
  getArrearCandidatesApi,
  getExamRegistrationsApi,
  registerArrearCandidatesApi,
  toggleExamRegistrationEligibilityApi,
  updateExamRegistrationApi
} from "../../api/examRegistrations.api";

const VIEW_TABS = {
  ASSIGNED: "ASSIGNED",
  ARREARS: "ARREARS",
  MANUAL: "MANUAL"
};

const ATTEMPT_TYPES = ["CURRENT", "ARREAR"];
const REGISTRATION_STATUSES = [
  "REGISTERED",
  "HALLTICKET_ISSUED",
  "ABSENT",
  "COMPLETED"
];

const emptyManualForm = {
  examSessionId: "",
  studentId: "",
  subjectId: "",
  sourceSemesterId: "",
  attemptType: "CURRENT",
  attemptNumber: "1",
  registrationStatus: "REGISTERED",
  isEligible: true,
  remarks: ""
};

const emptyAssignedFilter = {
  examSessionId: "",
  scopeType: "SPECIFIC",
  programId: "",
  batchId: ""
};

const emptyArrearFilter = {
  examSessionId: "",
  programId: "",
  batchId: "",
  searchStudent: ""
};

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-2 block text-sm font-medium text-[#243447]">
      {children}
      {required ? <span className="ml-1 text-[#C66B5D]">*</span> : null}
    </label>
  );
}

function TabCard({ title, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-3xl border p-5 text-left transition ${
        active
          ? "border-[#CFE0F6] bg-[#F4F8FD] shadow-sm"
          : "border-[#E6ECF2] bg-white hover:bg-[#FAFCFE]"
      }`}
    >
      <h3 className="text-base font-semibold text-[#243447]">{title}</h3>
      <p className="mt-2 text-sm text-[#6B7A8C]">{description}</p>
    </button>
  );
}

function StatusBadge({ value }) {
  const normalized = String(value || "").toUpperCase().trim();

  const classMap = {
    REGISTERED: "bg-[#EDF3FA] text-[#4A6A94] border-[#DCE7F7]",
    HALLTICKET_ISSUED: "bg-[#EEF8F1] text-[#3F7D56] border-[#D6EFD9]",
    ABSENT: "bg-[#FFF4E8] text-[#9A6A2A] border-[#F1DEC2]",
    COMPLETED: "bg-[#F3F0FF] text-[#6C4DB5] border-[#E2D9FF]"
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
        classMap[normalized] || "bg-[#EDF3FA] text-[#4A6A94] border-[#DCE7F7]"
      }`}
    >
      {normalized || "-"}
    </span>
  );
}

function AttemptBadge({ value }) {
  const normalized = String(value || "").toUpperCase().trim();
  const styles =
    normalized === "ARREAR"
      ? "bg-[#FFF1F3] text-[#B54769] border-[#F8D7DF]"
      : "bg-[#EDF3FA] text-[#4A6A94] border-[#DCE7F7]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles}`}>
      {normalized || "-"}
    </span>
  );
}

function EligibilityBadge({ value }) {
  const styles = value
    ? "bg-[#EEF8F1] text-[#3F7D56] border-[#D6EFD9]"
    : "bg-[#FFF1F3] text-[#B54769] border-[#F8D7DF]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles}`}>
      {value ? "ELIGIBLE" : "NOT ELIGIBLE"}
    </span>
  );
}

const inputClass =
  "w-full min-w-0 rounded-2xl border border-[#E2EAF2] bg-white px-4 py-3 text-[15px] text-[#243447] outline-none transition placeholder:text-[#9AA8B8] focus:border-[#7C9CCF] focus:ring-4 focus:ring-[#7C9CCF]/10";

function extractErrorMessage(err) {
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

  return "Operation failed";
}

const sessionLabel = (item) => {
  if (!item) return "-";
  const month = item.examMonth || "-";
  const year = item.examYear || "-";
  return `${item.name} (${month} ${year})`;
};

export default function ExamRegistrationsPage() {
  const [activeTab, setActiveTab] = useState(VIEW_TABS.ASSIGNED);

  const [registrations, setRegistrations] = useState([]);
  const [examSessions, setExamSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);

  const [arrearCandidates, setArrearCandidates] = useState([]);
  const [selectedArrearKeys, setSelectedArrearKeys] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [assignedFilter, setAssignedFilter] = useState(emptyAssignedFilter);
  const [arrearFilter, setArrearFilter] = useState(emptyArrearFilter);

  const [syncSummary, setSyncSummary] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [arrearLoading, setArrearLoading] = useState(false);
  const [arrearRegistering, setArrearRegistering] = useState(false);
  const [arrearSummary, setArrearSummary] = useState(null);

  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(null);
  const [manualForm, setManualForm] = useState(emptyManualForm);
  const [manualFormError, setManualFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState("");

  const [manualSearch, setManualSearch] = useState("");
  const [manualStatusFilter, setManualStatusFilter] = useState("");
  const [manualAttemptFilter, setManualAttemptFilter] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError("");

      const [
        registrationsResponse,
        examSessionsResponse,
        studentsResponse,
        subjectsResponse,
        semestersResponse,
        programsResponse,
        batchesResponse
      ] = await Promise.all([
        getExamRegistrationsApi(),
        getExamSessionsApi(),
        getStudentsApi(),
        getSubjectsApi(),
        getSemestersApi(),
        getProgramsApi(),
        getBatchesApi()
      ]);

      setRegistrations(registrationsResponse?.data || []);
      setExamSessions(examSessionsResponse?.data || []);
      setStudents(studentsResponse?.data || []);
      setSubjects(subjectsResponse?.data || []);
      setSemesters(semestersResponse?.data || []);
      setPrograms(programsResponse?.data || []);
      setBatches(batchesResponse?.data || []);
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const assignedStudents = useMemo(() => {
    if (!assignedFilter.examSessionId) return [];

    const baseStudents = students.filter((student) => {
      if (assignedFilter.scopeType === "ALL") return true;

      const studentProgramId = student?.programId?._id || student?.programId;
      const studentBatchId = student?.batchId?._id || student?.batchId;

      return (
        String(studentProgramId || "") === String(assignedFilter.programId) &&
        String(studentBatchId || "") === String(assignedFilter.batchId)
      );
    });

    return baseStudents.map((student) => {
      const currentRegistrations = registrations.filter((registration) => {
        const examSessionId = registration?.examSessionId?._id || registration?.examSessionId;
        const studentId = registration?.studentId?._id || registration?.studentId;

        return (
          String(examSessionId || "") === String(assignedFilter.examSessionId) &&
          String(studentId || "") === String(student._id) &&
          String(registration?.attemptType || "").toUpperCase() === "CURRENT"
        );
      });

      const currentSemesterLabel =
        student?.currentSemesterId?.label ||
        semesters.find(
          (item) =>
            String(item._id) ===
            String(student?.currentSemesterId?._id || student?.currentSemesterId || "")
        )?.label ||
        "-";

      return {
        studentId: student._id,
        registerNumber: student.registerNumber,
        fullName: student.fullName,
        currentSemesterLabel,
        currentRegistrations
      };
    });
  }, [assignedFilter, students, registrations, semesters]);

  const filteredManualRegistrations = useMemo(() => {
    const term = manualSearch.trim().toLowerCase();

    return registrations.filter((item) => {
      const matchesSearch =
        !term ||
        [
          item?.examSessionId?.name,
          item?.studentId?.registerNumber,
          item?.studentId?.fullName,
          item?.subjectId?.code,
          item?.subjectId?.name,
          item?.sourceSemesterId?.label,
          item?.attemptType,
          String(item?.attemptNumber || ""),
          item?.registrationStatus,
          item?.remarks
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesStatus =
        !manualStatusFilter ||
        String(item?.registrationStatus || "").toUpperCase() === manualStatusFilter;

      const matchesAttempt =
        !manualAttemptFilter ||
        String(item?.attemptType || "").toUpperCase() === manualAttemptFilter;

      return matchesSearch && matchesStatus && matchesAttempt;
    });
  }, [registrations, manualSearch, manualStatusFilter, manualAttemptFilter]);

  const handleAutoSyncCurrent = async () => {
    if (!assignedFilter.examSessionId) {
      setPageError("Exam session is required");
      return;
    }

    if (
      assignedFilter.scopeType === "SPECIFIC" &&
      (!assignedFilter.programId || !assignedFilter.batchId)
    ) {
      setPageError("Program and batch are required for specific assignment");
      return;
    }

    try {
      setSyncing(true);
      setPageError("");
      setSyncSummary(null);

      const payload =
        assignedFilter.scopeType === "ALL"
          ? {
              examSessionId: assignedFilter.examSessionId,
              scopeType: "ALL"
            }
          : {
              examSessionId: assignedFilter.examSessionId,
              scopeType: "SPECIFIC",
              programId: assignedFilter.programId,
              batchId: assignedFilter.batchId
            };

      const response = await autoSyncCurrentExamRegistrationsApi(payload);

      setSyncSummary(response?.data || response || null);
      await loadData();
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setSyncing(false);
    }
  };

  const handleLoadArrearCandidates = async () => {
    if (!arrearFilter.examSessionId) {
      setPageError("Exam session is required");
      return;
    }

    try {
      setArrearLoading(true);
      setPageError("");
      setArrearSummary(null);
      setSelectedArrearKeys([]);

      const response = await getArrearCandidatesApi({
        examSessionId: arrearFilter.examSessionId,
        programId: arrearFilter.programId || undefined,
        batchId: arrearFilter.batchId || undefined,
        studentSearch: arrearFilter.searchStudent || undefined
      });

      setArrearCandidates(response?.data || []);
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setArrearLoading(false);
    }
  };

  const toggleArrearSelection = (key) => {
    setSelectedArrearKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const handleRegisterSelectedArrears = async () => {
    if (!arrearFilter.examSessionId) {
      setPageError("Exam session is required");
      return;
    }

    const selectedRegistrations = [];

    arrearCandidates.forEach((student) => {
      student.arrearSubjects.forEach((subject) => {
        const key = `${student.studentId}__${subject.subjectId}__${subject.sourceSemesterId}`;
        if (selectedArrearKeys.includes(key)) {
          selectedRegistrations.push({
            studentId: student.studentId,
            subjectId: subject.subjectId,
            sourceSemesterId: subject.sourceSemesterId,
            attemptNumber: subject.nextAttemptNumber
          });
        }
      });
    });

    if (selectedRegistrations.length === 0) {
      setPageError("Select at least one arrear subject");
      return;
    }

    try {
      setArrearRegistering(true);
      setPageError("");
      const response = await registerArrearCandidatesApi({
        examSessionId: arrearFilter.examSessionId,
        registrations: selectedRegistrations
      });

      setArrearSummary(response?.data || response || null);
      setSelectedArrearKeys([]);
      await loadData();
      await handleLoadArrearCandidates();
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setArrearRegistering(false);
    }
  };

  const openCreateManualModal = () => {
    setEditingRegistration(null);
    setManualForm({
      ...emptyManualForm,
      examSessionId: assignedFilter.examSessionId || arrearFilter.examSessionId || ""
    });
    setManualFormError("");
    setManualModalOpen(true);
  };

  const openEditManualModal = (item) => {
    setEditingRegistration(item);
    setManualForm({
      examSessionId: item?.examSessionId?._id || "",
      studentId: item?.studentId?._id || "",
      subjectId: item?.subjectId?._id || "",
      sourceSemesterId: item?.sourceSemesterId?._id || "",
      attemptType: item?.attemptType || "CURRENT",
      attemptNumber: String(item?.attemptNumber || 1),
      registrationStatus: item?.registrationStatus || "REGISTERED",
      isEligible: Boolean(item?.isEligible),
      remarks: item?.remarks || ""
    });
    setManualFormError("");
    setManualModalOpen(true);
  };

  const closeManualModal = () => {
    if (saving) return;
    setManualModalOpen(false);
    setEditingRegistration(null);
    setManualForm(emptyManualForm);
    setManualFormError("");
  };

  const handleManualInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setManualForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const validateManualForm = () => {
    if (!manualForm.examSessionId) return "Exam session is required";
    if (!manualForm.studentId) return "Student is required";
    if (!manualForm.subjectId) return "Subject is required";
    if (!manualForm.sourceSemesterId) return "Source semester is required";
    if (!manualForm.attemptType) return "Attempt type is required";
    if (!manualForm.attemptNumber || Number(manualForm.attemptNumber) < 1) {
      return "Attempt number must be at least 1";
    }
    return "";
  };

  const buildManualPayload = () => ({
    examSessionId: manualForm.examSessionId,
    studentId: manualForm.studentId,
    subjectId: manualForm.subjectId,
    sourceSemesterId: manualForm.sourceSemesterId,
    attemptType: manualForm.attemptType,
    attemptNumber: Number(manualForm.attemptNumber),
    registrationStatus: manualForm.registrationStatus,
    isEligible: manualForm.isEligible,
    remarks: manualForm.remarks.trim()
  });

  const handleManualSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateManualForm();
    if (validationMessage) {
      setManualFormError(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setManualFormError("");

      const payload = buildManualPayload();

      if (editingRegistration?._id) {
        await updateExamRegistrationApi(editingRegistration._id, payload);
      } else {
        await createExamRegistrationApi(payload);
      }

      await loadData();
      closeManualModal();
    } catch (err) {
      setManualFormError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEligibility = async (examRegistrationId) => {
    try {
      setTogglingId(examRegistrationId);
      setPageError("");
      await toggleExamRegistrationEligibilityApi(examRegistrationId);
      await loadData();
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setTogglingId("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Registrations"
        subtitle="Check assigned current exams, review arrears, and correct only when needed"
      />

      <SectionCard
        title="Registration Review"
        subtitle="Current exams are assigned automatically and arrears are fetched from old published results"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <TabCard
            title="Assigned Exams"
            description="Review current exam assignments with exact student-wise curriculum matching."
            active={activeTab === VIEW_TABS.ASSIGNED}
            onClick={() => setActiveTab(VIEW_TABS.ASSIGNED)}
          />
          <TabCard
            title="Arrear Review"
            description="Fetch uncleared subjects from old published results and register selected arrears."
            active={activeTab === VIEW_TABS.ARREARS}
            onClick={() => setActiveTab(VIEW_TABS.ARREARS)}
          />
          <TabCard
            title="Manual Corrections"
            description="Fix mistakes, add missing registrations, or update special cases."
            active={activeTab === VIEW_TABS.MANUAL}
            onClick={() => setActiveTab(VIEW_TABS.MANUAL)}
          />
        </div>
      </SectionCard>

      {pageError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      {activeTab === VIEW_TABS.ASSIGNED ? (
        <>
          <SectionCard
            title="Assigned Current Exams"
            subtitle="Load assigned exams for one program/batch or the whole college at once"
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="min-w-0">
                <FieldLabel required>Exam Session</FieldLabel>
                <select
                  value={assignedFilter.examSessionId}
                  onChange={(event) =>
                    setAssignedFilter((prev) => ({
                      ...prev,
                      examSessionId: event.target.value
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">Select Exam Session</option>
                  {examSessions.map((item) => (
                    <option key={item._id} value={item._id}>
                      {sessionLabel(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <FieldLabel required>Assignment Scope</FieldLabel>
                <select
                  value={assignedFilter.scopeType}
                  onChange={(event) =>
                    setAssignedFilter((prev) => ({
                      ...prev,
                      scopeType: event.target.value,
                      programId: "",
                      batchId: ""
                    }))
                  }
                  className={inputClass}
                >
                  <option value="SPECIFIC">Specific Program and Batch</option>
                  <option value="ALL">All Programs and All Batches</option>
                </select>
              </div>

              {assignedFilter.scopeType === "SPECIFIC" ? (
                <>
                  <div className="min-w-0">
                    <FieldLabel required>Program</FieldLabel>
                    <select
                      value={assignedFilter.programId}
                      onChange={(event) =>
                        setAssignedFilter((prev) => ({
                          ...prev,
                          programId: event.target.value
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="">Select Program</option>
                      {programs.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="min-w-0">
                    <FieldLabel required>Batch</FieldLabel>
                    <select
                      value={assignedFilter.batchId}
                      onChange={(event) =>
                        setAssignedFilter((prev) => ({
                          ...prev,
                          batchId: event.target.value
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="">Select Batch</option>
                      {batches.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="min-w-0 lg:col-span-2">
                  <div className="rounded-2xl border border-[#DCE7F7] bg-[#F4F8FD] px-4 py-3 text-sm text-[#4A6A94]">
                    All active students across all programs and batches will be checked.
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAutoSyncCurrent}
                disabled={syncing}
                className="rounded-2xl bg-[#7C9CCF] px-5 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF] disabled:opacity-70"
              >
                {syncing ? "Loading Assigned Exams..." : "Load Assigned Exams"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAssignedFilter(emptyAssignedFilter);
                  setSyncSummary(null);
                }}
                className="rounded-2xl border border-[#E6ECF2] px-5 py-3 text-sm font-medium text-[#4A6A94] hover:bg-[#F8FAFC]"
              >
                Reset
              </button>
            </div>

            {syncSummary ? (
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5">
                  <p className="text-sm text-[#6B7A8C]">Students Checked</p>
                  <p className="mt-2 text-2xl font-semibold text-[#243447]">
                    {syncSummary.totalStudents ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5">
                  <p className="text-sm text-[#6B7A8C]">Current Exams Assigned</p>
                  <p className="mt-2 text-2xl font-semibold text-[#243447]">
                    {syncSummary.currentRegistrationsCreated ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5">
                  <p className="text-sm text-[#6B7A8C]">Duplicates Skipped</p>
                  <p className="mt-2 text-2xl font-semibold text-[#243447]">
                    {syncSummary.duplicatesSkipped ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5">
                  <p className="text-sm text-[#6B7A8C]">Skipped Students</p>
                  <p className="mt-2 text-2xl font-semibold text-[#243447]">
                    {syncSummary.skippedStudents?.length ?? 0}
                  </p>
                </div>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Student-wise Assigned Exams"
            subtitle="Only exact matched current curriculum subjects are shown for each student"
          >
            {assignedStudents.length === 0 ? (
              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
                Select exam session and scope, then load assigned exams.
              </div>
            ) : (
              <div className="grid gap-4">
                {assignedStudents.map((student) => (
                  <div
                    key={student.studentId}
                    className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-[#243447]">
                          {student.registerNumber} - {student.fullName}
                        </h3>
                        <p className="mt-1 text-sm text-[#6B7A8C]">
                          Current Semester: {student.currentSemesterLabel}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#DCE7F7] bg-white px-4 py-2 text-sm text-[#4A6A94]">
                        Current Assigned Subjects: {student.currentRegistrations.length}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {student.currentRegistrations.length > 0 ? (
                        student.currentRegistrations.map((registration) => (
                          <div
                            key={registration._id}
                            className="rounded-2xl border border-[#E6ECF2] bg-white p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-medium text-[#243447]">
                                  {registration?.subjectId?.code || "-"} - {registration?.subjectId?.name || "-"}
                                </p>
                                <p className="mt-1 text-sm text-[#6B7A8C]">
                                  Source Semester: {registration?.sourceSemesterId?.label || "-"}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <AttemptBadge value={registration?.attemptType} />
                                <StatusBadge value={registration?.registrationStatus} />
                                <EligibilityBadge value={registration?.isEligible} />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-[#F2D7D2] bg-[#FFF8F6] p-4 text-sm text-[#A14B3B]">
                          No current subjects assigned yet for this student.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      ) : null}

      {activeTab === VIEW_TABS.ARREARS ? (
        <>
          <SectionCard
            title="Arrear Review"
            subtitle="Fetch uncleared subjects from old published results and register selected arrears"
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="min-w-0">
                <FieldLabel required>Exam Session</FieldLabel>
                <select
                  value={arrearFilter.examSessionId}
                  onChange={(event) =>
                    setArrearFilter((prev) => ({
                      ...prev,
                      examSessionId: event.target.value
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">Select Exam Session</option>
                  {examSessions.map((item) => (
                    <option key={item._id} value={item._id}>
                      {sessionLabel(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <FieldLabel>Program</FieldLabel>
                <select
                  value={arrearFilter.programId}
                  onChange={(event) =>
                    setArrearFilter((prev) => ({
                      ...prev,
                      programId: event.target.value
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">All Programs</option>
                  {programs.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <FieldLabel>Batch</FieldLabel>
                <select
                  value={arrearFilter.batchId}
                  onChange={(event) =>
                    setArrearFilter((prev) => ({
                      ...prev,
                      batchId: event.target.value
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">All Batches</option>
                  {batches.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <FieldLabel>Student Search</FieldLabel>
                <input
                  type="text"
                  value={arrearFilter.searchStudent}
                  onChange={(event) =>
                    setArrearFilter((prev) => ({
                      ...prev,
                      searchStudent: event.target.value
                    }))
                  }
                  placeholder="Search by register no or name"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleLoadArrearCandidates}
                disabled={arrearLoading}
                className="rounded-2xl bg-[#7C9CCF] px-5 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF] disabled:opacity-70"
              >
                {arrearLoading ? "Loading..." : "Load Arrear Candidates"}
              </button>

              <button
                type="button"
                onClick={handleRegisterSelectedArrears}
                disabled={arrearRegistering || selectedArrearKeys.length === 0}
                className="rounded-2xl border border-[#DCE7F7] bg-white px-5 py-3 text-sm font-medium text-[#4A6A94] hover:bg-[#F8FAFC] disabled:opacity-70"
              >
                {arrearRegistering
                  ? "Registering..."
                  : `Register Selected Arrears (${selectedArrearKeys.length})`}
              </button>
            </div>

            {arrearSummary ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5">
                  <p className="text-sm text-[#6B7A8C]">Created</p>
                  <p className="mt-2 text-2xl font-semibold text-[#243447]">
                    {arrearSummary.createdCount ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5">
                  <p className="text-sm text-[#6B7A8C]">Duplicates Skipped</p>
                  <p className="mt-2 text-2xl font-semibold text-[#243447]">
                    {arrearSummary.duplicatesSkipped ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5">
                  <p className="text-sm text-[#6B7A8C]">Failed Rows</p>
                  <p className="mt-2 text-2xl font-semibold text-[#243447]">
                    {arrearSummary.failedRows?.length ?? 0}
                  </p>
                </div>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Student-wise Arrear Candidates"
            subtitle="These subjects come from old published non-pass processed results"
          >
            {arrearCandidates.length === 0 ? (
              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
                Load arrear candidates to review uncleared subjects.
              </div>
            ) : (
              <div className="grid gap-4">
                {arrearCandidates.map((student) => (
                  <div
                    key={student.studentId}
                    className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5"
                  >
                    <h3 className="text-base font-semibold text-[#243447]">
                      {student.registerNumber} - {student.fullName}
                    </h3>
                    <p className="mt-1 text-sm text-[#6B7A8C]">
                      Current Semester: {student.currentSemesterLabel}
                    </p>

                    <div className="mt-4 grid gap-3">
                      {student.arrearSubjects.map((subject) => {
                        const key = `${student.studentId}__${subject.subjectId}__${subject.sourceSemesterId}`;
                        const checked = selectedArrearKeys.includes(key);

                        return (
                          <label
                            key={key}
                            className="flex cursor-pointer items-start gap-4 rounded-2xl border border-[#E6ECF2] bg-white p-4"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleArrearSelection(key)}
                              className="mt-1 h-4 w-4"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[#243447]">
                                {subject.subjectCode} - {subject.subjectName}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2 text-sm text-[#6B7A8C]">
                                <span>Source Semester: {subject.sourceSemesterLabel}</span>
                                <span>Previous Status: {subject.passStatus}</span>
                                <span>Next Attempt: {subject.nextAttemptNumber}</span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      ) : null}

      {activeTab === VIEW_TABS.MANUAL ? (
        <>
          <SectionCard
            title="Manual Corrections"
            subtitle="Fix mistakes, add missing registrations, or update special cases"
            action={
              <button
                type="button"
                onClick={openCreateManualModal}
                className="rounded-2xl bg-[#7C9CCF] px-4 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF]"
              >
                Add Manual Registration
              </button>
            }
          >
            <div className="flex w-full min-w-0 flex-col gap-3 xl:w-auto xl:flex-row">
              <select
                value={manualAttemptFilter}
                onChange={(event) => setManualAttemptFilter(event.target.value)}
                className={inputClass}
              >
                <option value="">All Attempt Types</option>
                {ATTEMPT_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={manualStatusFilter}
                onChange={(event) => setManualStatusFilter(event.target.value)}
                className={inputClass}
              >
                <option value="">All Registration Statuses</option>
                {REGISTRATION_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={manualSearch}
                onChange={(event) => setManualSearch(event.target.value)}
                placeholder="Search registrations..."
                className={`xl:w-72 ${inputClass}`}
              />
            </div>

            {loading ? (
              <div className="mt-6 rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
                Loading exam registrations...
              </div>
            ) : filteredManualRegistrations.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
                No exam registrations found.
              </div>
            ) : (
              <div className="mt-6">
                <div className="hidden overflow-x-auto xl:block">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#EDF3FA] text-[#243447]">
                      <tr>
                        <th className="px-4 py-3 text-left">Exam Session</th>
                        <th className="px-4 py-3 text-left">Register No</th>
                        <th className="px-4 py-3 text-left">Student Name</th>
                        <th className="px-4 py-3 text-left">Subject</th>
                        <th className="px-4 py-3 text-left">Source Semester</th>
                        <th className="px-4 py-3 text-left">Attempt</th>
                        <th className="px-4 py-3 text-left">Attempt No</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Eligibility</th>
                        <th className="px-4 py-3 text-left">Remarks</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredManualRegistrations.map((item) => (
                        <tr key={item._id} className="border-t border-[#E6ECF2]">
                          <td className="px-4 py-4 text-[#243447]">
                            {sessionLabel(item.examSessionId)}
                          </td>
                          <td className="px-4 py-4 font-medium text-[#243447]">
                            {item?.studentId?.registerNumber || "-"}
                          </td>
                          <td className="px-4 py-4 text-[#243447]">
                            {item?.studentId?.fullName || "-"}
                          </td>
                          <td className="px-4 py-4 text-[#243447]">
                            {item?.subjectId?.code || "-"} - {item?.subjectId?.name || "-"}
                          </td>
                          <td className="px-4 py-4 text-[#243447]">
                            {item?.sourceSemesterId?.label || "-"}
                          </td>
                          <td className="px-4 py-4">
                            <AttemptBadge value={item?.attemptType} />
                          </td>
                          <td className="px-4 py-4 text-[#243447]">
                            {item?.attemptNumber || 1}
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge value={item?.registrationStatus} />
                          </td>
                          <td className="px-4 py-4">
                            <EligibilityBadge value={item?.isEligible} />
                          </td>
                          <td className="max-w-[220px] px-4 py-4 text-[#243447]">
                            <span className="line-clamp-2">{item?.remarks || "-"}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openEditManualModal(item)}
                                className="rounded-xl border border-[#E6ECF2] px-3 py-2 text-sm font-medium text-[#4A6A94] hover:bg-[#F8FAFC]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleEligibility(item._id)}
                                disabled={togglingId === item._id}
                                className="rounded-xl border border-[#E6ECF2] px-3 py-2 text-sm font-medium text-[#7A5C1E] hover:bg-[#FFF9EE] disabled:opacity-70"
                              >
                                {togglingId === item._id ? "Updating..." : "Toggle Eligibility"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-4 xl:hidden">
                  {filteredManualRegistrations.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className="truncate text-base font-semibold text-[#243447]">
                            {item?.studentId?.fullName || "-"}
                          </h4>
                          <p className="mt-1 text-sm text-[#6B7A8C]">
                            {item?.studentId?.registerNumber || "-"}
                          </p>
                        </div>
                        <EligibilityBadge value={item?.isEligible} />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <AttemptBadge value={item?.attemptType} />
                        <StatusBadge value={item?.registrationStatus} />
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-[#243447]">
                        <p>
                          <span className="font-medium">Exam Session:</span>{" "}
                          {sessionLabel(item.examSessionId)}
                        </p>
                        <p>
                          <span className="font-medium">Subject:</span>{" "}
                          {item?.subjectId?.code || "-"} - {item?.subjectId?.name || "-"}
                        </p>
                        <p>
                          <span className="font-medium">Source Semester:</span>{" "}
                          {item?.sourceSemesterId?.label || "-"}
                        </p>
                        <p>
                          <span className="font-medium">Attempt Number:</span>{" "}
                          {item?.attemptNumber || 1}
                        </p>
                        <p>
                          <span className="font-medium">Remarks:</span> {item?.remarks || "-"}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => openEditManualModal(item)}
                          className="rounded-xl border border-[#E6ECF2] px-3 py-2 text-sm font-medium text-[#4A6A94] hover:bg-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleEligibility(item._id)}
                          disabled={togglingId === item._id}
                          className="rounded-xl border border-[#E6ECF2] px-3 py-2 text-sm font-medium text-[#7A5C1E] hover:bg-[#FFF9EE] disabled:opacity-70"
                        >
                          {togglingId === item._id ? "Updating..." : "Toggle Eligibility"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <Modal
            open={manualModalOpen}
            onClose={closeManualModal}
            title={editingRegistration ? "Edit Manual Registration" : "Add Manual Registration"}
          >
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="min-w-0 lg:col-span-3">
                  <FieldLabel required>Exam Session</FieldLabel>
                  <select
                    name="examSessionId"
                    value={manualForm.examSessionId}
                    onChange={handleManualInputChange}
                    className={inputClass}
                  >
                    <option value="">Select Exam Session</option>
                    {examSessions.map((item) => (
                      <option key={item._id} value={item._id}>
                        {sessionLabel(item)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0 lg:col-span-3">
                  <FieldLabel required>Student</FieldLabel>
                  <select
                    name="studentId"
                    value={manualForm.studentId}
                    onChange={handleManualInputChange}
                    className={inputClass}
                  >
                    <option value="">Select Student</option>
                    {students.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.registerNumber || "-"} - {item.fullName || "-"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0 lg:col-span-3">
                  <FieldLabel required>Subject</FieldLabel>
                  <select
                    name="subjectId"
                    value={manualForm.subjectId}
                    onChange={handleManualInputChange}
                    className={inputClass}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.code || "-"} - {item.name || "-"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <FieldLabel required>Source Semester</FieldLabel>
                  <select
                    name="sourceSemesterId"
                    value={manualForm.sourceSemesterId}
                    onChange={handleManualInputChange}
                    className={inputClass}
                  >
                    <option value="">Select Source Semester</option>
                    {semesters.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <FieldLabel required>Attempt Type</FieldLabel>
                  <select
                    name="attemptType"
                    value={manualForm.attemptType}
                    onChange={handleManualInputChange}
                    className={inputClass}
                  >
                    {ATTEMPT_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <FieldLabel required>Attempt Number</FieldLabel>
                  <input
                    type="number"
                    min="1"
                    name="attemptNumber"
                    value={manualForm.attemptNumber}
                    onChange={handleManualInputChange}
                    className={inputClass}
                  />
                </div>

                <div className="min-w-0">
                  <FieldLabel>Registration Status</FieldLabel>
                  <select
                    name="registrationStatus"
                    value={manualForm.registrationStatus}
                    onChange={handleManualInputChange}
                    className={inputClass}
                  >
                    {REGISTRATION_STATUSES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0 flex items-end">
                  <label className="flex items-center gap-3 rounded-2xl border border-[#E2EAF2] px-4 py-3 text-sm text-[#243447]">
                    <input
                      type="checkbox"
                      name="isEligible"
                      checked={manualForm.isEligible}
                      onChange={handleManualInputChange}
                      className="h-4 w-4"
                    />
                    Eligible for Exam
                  </label>
                </div>

                <div className="min-w-0 lg:col-span-3">
                  <FieldLabel>Remarks</FieldLabel>
                  <textarea
                    name="remarks"
                    value={manualForm.remarks}
                    onChange={handleManualInputChange}
                    rows={4}
                    placeholder="Optional remarks"
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              {manualFormError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {manualFormError}
                </div>
              ) : null}

              <div className="sticky bottom-0 flex flex-col gap-3 border-t border-[#EEF2F6] bg-white pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeManualModal}
                  className="rounded-2xl border border-[#E6ECF2] px-5 py-3 text-sm font-medium text-[#4A6A94] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-[#7C9CCF] px-5 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF] disabled:opacity-70"
                >
                  {saving
                    ? "Saving..."
                    : editingRegistration
                      ? "Update Manual Registration"
                      : "Create Manual Registration"}
                </button>
              </div>
            </form>
          </Modal>
        </>
      ) : null}
    </div>
  );
}
