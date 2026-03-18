import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import { getExamSessionsApi } from "../../api/examSessions.api";
import {
  getProcessedResultsApi,
  getSemesterSummariesApi,
  processExamSessionResultsApi
} from "../../api/resultsProcessing.api";

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

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5">
      <p className="text-sm text-[#6B7A8C]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#243447]">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const value = String(status || "").toUpperCase();

  const classMap = {
    PASS: "border-[#BFE3C8] bg-[#F2FBF4] text-[#2E7D32]",
    FAIL: "border-[#F5C2C7] bg-[#FFF5F5] text-[#B42318]",
    ABSENT: "border-[#FAD7A0] bg-[#FFF8E8] text-[#B26A00]",
    WITHHELD: "border-[#D6D3F0] bg-[#F7F5FF] text-[#5B4AB1]",
    MALPRACTICE: "border-[#F5C2C7] bg-[#FFF5F5] text-[#B42318]"
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        classMap[value] || "border-[#E2EAF2] bg-[#F8FAFC] text-[#6B7A8C]"
      }`}
    >
      {value || "-"}
    </span>
  );
}

export default function ResultsProcessingPage() {
  const [examSessions, setExamSessions] = useState([]);
  const [processedResults, setProcessedResults] = useState([]);
  const [semesterSummaries, setSemesterSummaries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [pageError, setPageError] = useState("");

  const [filters, setFilters] = useState({
    examSessionId: "",
    studentSearch: "",
    resultTab: "processed-results"
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError("");

      const [examSessionsResponse, processedResultsResponse, semesterSummariesResponse] =
        await Promise.all([
          getExamSessionsApi(),
          getProcessedResultsApi(),
          getSemesterSummariesApi()
        ]);

      setExamSessions(examSessionsResponse?.data || []);
      setProcessedResults(processedResultsResponse?.data || []);
      setSemesterSummaries(semesterSummariesResponse?.data || []);
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProcessExamSession = async () => {
    if (!filters.examSessionId) {
      setPageError("Exam session is required");
      return;
    }

    try {
      setProcessing(true);
      setPageError("");

      await processExamSessionResultsApi({
        examSessionId: filters.examSessionId
      });

      await loadData();
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const filteredProcessedResults = useMemo(() => {
    return processedResults.filter((item) => {
      const matchesExamSession =
        !filters.examSessionId ||
        String(item?.examSessionId?._id || item?.examSessionId || "") ===
          String(filters.examSessionId);

      const search = filters.studentSearch.trim().toLowerCase();
      const matchesStudent =
        !search ||
        [item?.studentId?.registerNumber, item?.studentId?.fullName, item?.subjectId?.code]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      return matchesExamSession && matchesStudent;
    });
  }, [processedResults, filters.examSessionId, filters.studentSearch]);

  const filteredSemesterSummaries = useMemo(() => {
    return semesterSummaries.filter((item) => {
      const matchesExamSession =
        !filters.examSessionId ||
        String(item?.examSessionId?._id || item?.examSessionId || "") ===
          String(filters.examSessionId);

      const search = filters.studentSearch.trim().toLowerCase();
      const matchesStudent =
        !search ||
        [item?.studentId?.registerNumber, item?.studentId?.fullName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      return matchesExamSession && matchesStudent;
    });
  }, [semesterSummaries, filters.examSessionId, filters.studentSearch]);

  const summary = useMemo(() => {
    return {
      processedCount: filteredProcessedResults.length,
      passedCount: filteredProcessedResults.filter((item) => item.passStatus === "PASS")
        .length,
      failedCount: filteredProcessedResults.filter((item) => item.passStatus === "FAIL")
        .length,
      semesterSummaryCount: filteredSemesterSummaries.length
    };
  }, [filteredProcessedResults, filteredSemesterSummaries]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Results Processing"
        subtitle="Process locked mark entries into processed results and semester summaries"
      />

      <SectionCard
        title="Process Exam Session"
        subtitle="Select exam session and process all locked mark entries"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
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

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleProcessExamSession}
              disabled={processing || !filters.examSessionId}
              className="rounded-2xl bg-[#7C9CCF] px-5 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF] disabled:opacity-70"
            >
              {processing ? "Processing..." : "Process Results"}
            </button>
          </div>
        </div>
      </SectionCard>

      {pageError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      <SectionCard
        title="Results Overview"
        subtitle="Current filtered result statistics"
      >
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Processed Results" value={summary.processedCount} />
          <StatCard label="Passed" value={summary.passedCount} />
          <StatCard label="Failed" value={summary.failedCount} />
          <StatCard label="Semester Summaries" value={summary.semesterSummaryCount} />
        </div>
      </SectionCard>

      <SectionCard
        title="Result Filters"
        subtitle="Search processed results and semester summaries"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="min-w-0">
            <label className="mb-2 block text-sm font-medium text-[#243447]">
              View
            </label>
            <select
              value={filters.resultTab}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  resultTab: event.target.value
                }))
              }
              className={inputClass}
            >
              <option value="processed-results">Processed Results</option>
              <option value="semester-summaries">Semester Summaries</option>
            </select>
          </div>

          <div className="min-w-0 lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[#243447]">
              Student / Subject Search
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
              placeholder="Register no, student name, or subject code"
              className={inputClass}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={
          filters.resultTab === "processed-results"
            ? "Processed Results"
            : "Semester Summaries"
        }
        subtitle={
          filters.resultTab === "processed-results"
            ? "Subject-wise processed results for filtered students"
            : "Semester-wise GPA and CGPA summaries"
        }
      >
        {loading ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            Loading results data...
          </div>
        ) : filters.resultTab === "processed-results" ? (
          filteredProcessedResults.length === 0 ? (
            <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
              No processed results found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#EDF3FA] text-[#243447]">
                  <tr>
                    <th className="px-4 py-3 text-left">Register No</th>
                    <th className="px-4 py-3 text-left">Student Name</th>
                    <th className="px-4 py-3 text-left">Subject</th>
                    <th className="px-4 py-3 text-left">Attempt</th>
                    <th className="px-4 py-3 text-left">Marks</th>
                    <th className="px-4 py-3 text-left">Grade</th>
                    <th className="px-4 py-3 text-left">GP</th>
                    <th className="px-4 py-3 text-left">Credits Earned</th>
                    <th className="px-4 py-3 text-left">Pass Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProcessedResults.map((item) => (
                    <tr
                      key={item._id}
                      className="border-t border-[#E6ECF2] bg-white"
                    >
                      <td className="px-4 py-4 font-medium text-[#243447]">
                        {item?.studentId?.registerNumber || "-"}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {item?.studentId?.fullName || "-"}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {(item?.subjectId?.code || "-") +
                          " - " +
                          (item?.subjectId?.name || "-")}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {item?.attemptType || "-"} / {item?.attemptNumber || "-"}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {item?.internalMark ?? 0} + {item?.externalMark ?? 0} ={" "}
                        {item?.totalMark ?? 0}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {item?.grade || "-"}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {item?.gradePoint ?? 0}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {item?.creditsEarned ?? 0}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={item?.passStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : filteredSemesterSummaries.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            No semester summaries found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#EDF3FA] text-[#243447]">
                <tr>
                  <th className="px-4 py-3 text-left">Register No</th>
                  <th className="px-4 py-3 text-left">Student Name</th>
                  <th className="px-4 py-3 text-left">Semester</th>
                  <th className="px-4 py-3 text-left">GPA</th>
                  <th className="px-4 py-3 text-left">CGPA</th>
                  <th className="px-4 py-3 text-left">Registered Credits</th>
                  <th className="px-4 py-3 text-left">Earned Credits</th>
                  <th className="px-4 py-3 text-left">Pending Arrears</th>
                  <th className="px-4 py-3 text-left">Cleared Arrears</th>
                </tr>
              </thead>
              <tbody>
                {filteredSemesterSummaries.map((item) => (
                  <tr
                    key={item._id}
                    className="border-t border-[#E6ECF2] bg-white"
                  >
                    <td className="px-4 py-4 font-medium text-[#243447]">
                      {item?.studentId?.registerNumber || "-"}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item?.studentId?.fullName || "-"}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item?.semesterId?.label || "-"}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item?.gpa ?? 0}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item?.cgpa ?? 0}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item?.registeredCredits ?? 0}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item?.earnedCredits ?? 0}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item?.pendingArrears ?? 0}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item?.clearedArrears ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}