import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import { getExamSessionsApi } from "../../api/examSessions.api";
import { getExamRegistrationsApi } from "../../api/examRegistrations.api";
import { getProgramsApi } from "../../api/programs.api";
import { getBatchesApi } from "../../api/batches.api";

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

function groupRegistrationsByStudent(registrations) {
  const map = new Map();

  registrations.forEach((registration) => {
    const student = registration?.studentId;
    const studentId = student?._id || registration?.studentId;

    if (!studentId) return;

    if (!map.has(String(studentId))) {
      map.set(String(studentId), {
        studentId: student?._id || studentId,
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
        programName:
          student?.programId?.name ||
          student?.programId?.shortName ||
          student?.programId?.code ||
          "-",
        batchLabel: student?.batchId?.label || "-",
        subjects: []
      });
    }

    map.get(String(studentId)).subjects.push({
      registrationId: registration?._id,
      subjectCode: registration?.subjectId?.code || "-",
      subjectName: registration?.subjectId?.name || "-",
      sourceSemesterLabel: registration?.sourceSemesterId?.label || "-",
      attemptType: registration?.attemptType || "-",
      registrationStatus: registration?.registrationStatus || "-"
    });
  });

  return Array.from(map.values()).sort((a, b) =>
    String(a.registerNumber).localeCompare(String(b.registerNumber))
  );
}

export default function RegistrationPdfExportPage() {
  const [examSessions, setExamSessions] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [filters, setFilters] = useState({
    examSessionId: "",
    programId: "",
    batchId: "",
    studentSearch: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError("");

      const [
        examSessionsResponse,
        programsResponse,
        batchesResponse,
        registrationsResponse
      ] = await Promise.all([
        getExamSessionsApi(),
        getProgramsApi(),
        getBatchesApi(),
        getExamRegistrationsApi()
      ]);

      setExamSessions(examSessionsResponse?.data || []);
      setPrograms(programsResponse?.data || []);
      setBatches(batchesResponse?.data || []);
      setRegistrations(registrationsResponse?.data || []);
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRegistrations = useMemo(() => {
    if (!filters.examSessionId || !filters.programId || !filters.batchId) {
      return [];
    }

    return registrations.filter((item) => {
      const examSessionId = item?.examSessionId?._id || item?.examSessionId;
      const studentProgramId =
        item?.studentId?.programId?._id || item?.studentId?.programId;
      const studentBatchId =
        item?.studentId?.batchId?._id || item?.studentId?.batchId;

      const matchesExamSession =
        String(examSessionId || "") === String(filters.examSessionId);

      const matchesProgram =
        String(studentProgramId || "") === String(filters.programId);

      const matchesBatch =
        String(studentBatchId || "") === String(filters.batchId);

      const searchTerm = filters.studentSearch.trim().toLowerCase();
      const matchesStudentSearch =
        !searchTerm ||
        [item?.studentId?.registerNumber, item?.studentId?.fullName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchTerm));

      return (
        matchesExamSession &&
        matchesProgram &&
        matchesBatch &&
        matchesStudentSearch
      );
    });
  }, [registrations, filters]);

  const groupedStudents = useMemo(
    () => groupRegistrationsByStudent(filteredRegistrations),
    [filteredRegistrations]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registration Verification"
        subtitle="Verify student-wise registered subjects before mark entry"
      />

      <SectionCard
        title="Verification Filters"
        subtitle="Select exact exam session, program, and batch"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="min-w-0">
            <label className="mb-2 block text-sm font-medium text-[#243447]">
              Exam Session
            </label>
            <select
              value={filters.examSessionId}
              onChange={(event) =>
                setFilters((prev) => ({
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
            <label className="mb-2 block text-sm font-medium text-[#243447]">
              Program
            </label>
            <select
              value={filters.programId}
              onChange={(event) =>
                setFilters((prev) => ({
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
            <label className="mb-2 block text-sm font-medium text-[#243447]">
              Batch
            </label>
            <select
              value={filters.batchId}
              onChange={(event) =>
                setFilters((prev) => ({
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

          <div className="min-w-0">
            <label className="mb-2 block text-sm font-medium text-[#243447]">
              Student Search
            </label>
            <input
              type="text"
              value={filters.studentSearch}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  studentSearch: event.target.value
                }))
              }
              placeholder="Register no or name"
              className={inputClass}
            />
          </div>
        </div>
      </SectionCard>

      {loading ? (
        <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
          Loading registration verification...
        </div>
      ) : pageError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {pageError}
        </div>
      ) : !filters.examSessionId || !filters.programId || !filters.batchId ? (
        <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
          Select exam session, program, and batch to verify registrations.
        </div>
      ) : groupedStudents.length === 0 ? (
        <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
          No registered subjects found for the selected filters.
        </div>
      ) : (
        <div className="space-y-5">
          {groupedStudents.map((student) => (
            <SectionCard
              key={student.studentId}
              title={`${student.registerNumber} - ${student.fullName}`}
              subtitle={`${student.departmentName} • ${student.programName} • ${student.batchLabel} • ${student.currentSemesterLabel}`}
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7A8C]">
                    Register Number
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#243447]">
                    {student.registerNumber}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7A8C]">
                    Department
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#243447]">
                    {student.departmentName}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7A8C]">
                    Program
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#243447]">
                    {student.programName}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7A8C]">
                    Current Semester
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#243447]">
                    {student.currentSemesterLabel}
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-3xl border border-[#E6ECF2]">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#EDF3FA] text-[#243447]">
                    <tr>
                      <th className="px-4 py-4 text-left font-semibold">S.No</th>
                      <th className="px-4 py-4 text-left font-semibold">Subject Code</th>
                      <th className="px-4 py-4 text-left font-semibold">Subject Name</th>
                      <th className="px-4 py-4 text-left font-semibold">Source Semester</th>
                      <th className="px-4 py-4 text-left font-semibold">Attempt Type</th>
                      <th className="px-4 py-4 text-left font-semibold">Registration Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.subjects.map((subject, index) => (
                      <tr
                        key={`${student.studentId}-${subject.registrationId}-${index}`}
                        className="border-t border-[#EEF2F6] bg-white"
                      >
                        <td className="px-4 py-4 text-[#243447]">{index + 1}</td>
                        <td className="px-4 py-4 font-medium text-[#243447]">
                          {subject.subjectCode}
                        </td>
                        <td className="px-4 py-4 text-[#243447]">
                          {subject.subjectName}
                        </td>
                        <td className="px-4 py-4 text-[#243447]">
                          {subject.sourceSemesterLabel}
                        </td>
                        <td className="px-4 py-4 text-[#243447]">
                          {subject.attemptType}
                        </td>
                        <td className="px-4 py-4 text-[#243447]">
                          {subject.registrationStatus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-end rounded-2xl bg-[#F8FAFC] px-4 py-3">
                <p className="text-sm font-medium text-[#4A6A94]">
                  Total Registered Subjects:{" "}
                  <span className="font-bold text-[#243447]">
                    {student.subjects.length}
                  </span>
                </p>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}