import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import { getExamSessionsApi } from "../../api/examSessions.api";
import { getProgramsApi } from "../../api/programs.api";
import { getBatchesApi } from "../../api/batches.api";
import {
  getMarkEntriesApi,
  updateMarkEntryApi,
  verifyMarkEntryApi,
  lockMarkEntryApi
} from "../../api/markEntries.api";

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

function StatusBadge({ status }) {
  const value = String(status || "").toUpperCase();

  const statusClassMap = {
    DRAFT: "border-[#FAD7A0] bg-[#FFF8E8] text-[#B26A00]",
    VERIFIED: "border-[#BFE3C8] bg-[#F2FBF4] text-[#2E7D32]",
    LOCKED: "border-[#BFD3F2] bg-[#F3F8FE] text-[#295E9B]"
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        statusClassMap[value] || "border-[#E2EAF2] bg-[#F8FAFC] text-[#6B7A8C]"
      }`}
    >
      {value || "-"}
    </span>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5">
      <p className="text-sm text-[#6B7A8C]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#243447]">{value}</p>
    </div>
  );
}

function toInputValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

export default function MarkEntriesPage() {
  const [examSessions, setExamSessions] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [markEntries, setMarkEntries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [verifyingId, setVerifyingId] = useState("");
  const [lockingId, setLockingId] = useState("");
  const [pageError, setPageError] = useState("");

  const [filters, setFilters] = useState({
    examSessionId: "",
    programId: "",
    batchId: "",
    subjectSearch: "",
    studentSearch: ""
  });

  const [editedRows, setEditedRows] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError("");

      const [examSessionsResponse, programsResponse, batchesResponse, markEntriesResponse] =
        await Promise.all([
          getExamSessionsApi(),
          getProgramsApi(),
          getBatchesApi(),
          getMarkEntriesApi()
        ]);

      const entries = markEntriesResponse?.data || [];

      setExamSessions(examSessionsResponse?.data || []);
      setPrograms(programsResponse?.data || []);
      setBatches(batchesResponse?.data || []);
      setMarkEntries(entries);

      const nextEditedRows = {};
      entries.forEach((entry) => {
        nextEditedRows[entry._id] = {
          internalMark: entry.internalMark ?? "",
          externalMark: entry.externalMark ?? "",
          isAbsent: Boolean(entry.isAbsent),
          isWithheld: Boolean(entry.isWithheld),
          isMalpractice: Boolean(entry.isMalpractice)
        };
      });
      setEditedRows(nextEditedRows);
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEntries = useMemo(() => {
    return markEntries.filter((entry) => {
      const examSessionId = entry?.examSessionId?._id || entry?.examSessionId;
      const studentProgramId =
        entry?.studentId?.programId?._id || entry?.studentId?.programId;
      const studentBatchId =
        entry?.studentId?.batchId?._id || entry?.studentId?.batchId;

      const matchesExamSession =
        !filters.examSessionId ||
        String(examSessionId || "") === String(filters.examSessionId);

      const matchesProgram =
        !filters.programId ||
        String(studentProgramId || "") === String(filters.programId);

      const matchesBatch =
        !filters.batchId ||
        String(studentBatchId || "") === String(filters.batchId);

      const subjectTerm = filters.subjectSearch.trim().toLowerCase();
      const matchesSubject =
        !subjectTerm ||
        [entry?.subjectId?.code, entry?.subjectId?.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(subjectTerm));

      const studentTerm = filters.studentSearch.trim().toLowerCase();
      const matchesStudent =
        !studentTerm ||
        [entry?.studentId?.registerNumber, entry?.studentId?.fullName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(studentTerm));

      return (
        matchesExamSession &&
        matchesProgram &&
        matchesBatch &&
        matchesSubject &&
        matchesStudent
      );
    });
  }, [markEntries, filters]);

  const summary = useMemo(() => {
    return {
      total: filteredEntries.length,
      draft: filteredEntries.filter((item) => item.entryStatus === "DRAFT").length,
      verified: filteredEntries.filter((item) => item.entryStatus === "VERIFIED").length,
      locked: filteredEntries.filter((item) => item.entryStatus === "LOCKED").length
    };
  }, [filteredEntries]);

  const handleRowChange = (markEntryId, field, value) => {
    setEditedRows((prev) => {
      const current = prev[markEntryId] || {
        internalMark: "",
        externalMark: "",
        isAbsent: false,
        isWithheld: false,
        isMalpractice: false
      };

      const next = {
        ...current,
        [field]: value
      };

      if (field === "isAbsent" && value) {
        next.isWithheld = false;
        next.isMalpractice = false;
        next.internalMark = "";
        next.externalMark = "";
      }

      if (field === "isWithheld" && value) {
        next.isAbsent = false;
        next.isMalpractice = false;
        next.internalMark = "";
        next.externalMark = "";
      }

      if (field === "isMalpractice" && value) {
        next.isAbsent = false;
        next.isWithheld = false;
        next.internalMark = "";
        next.externalMark = "";
      }

      return {
        ...prev,
        [markEntryId]: next
      };
    });
  };

  const handleSave = async (entry) => {
    const draft = editedRows[entry._id] || {};
    const isLocked = entry.entryStatus === "LOCKED";

    if (isLocked) {
      setPageError("Locked mark entry cannot be updated");
      return;
    }

    try {
      setSavingId(entry._id);
      setPageError("");

      const isSpecialCase =
        Boolean(draft.isAbsent) ||
        Boolean(draft.isWithheld) ||
        Boolean(draft.isMalpractice);

      const payload = {
        internalMark: isSpecialCase
          ? 0
          : draft.internalMark === ""
            ? 0
            : Number(draft.internalMark),
        externalMark: isSpecialCase
          ? 0
          : draft.externalMark === ""
            ? 0
            : Number(draft.externalMark),
        isAbsent: Boolean(draft.isAbsent),
        isWithheld: Boolean(draft.isWithheld),
        isMalpractice: Boolean(draft.isMalpractice)
      };

      await updateMarkEntryApi(entry._id, payload);
      await loadData();
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setSavingId("");
    }
  };

  const handleVerify = async (markEntryId) => {
    try {
      setVerifyingId(markEntryId);
      setPageError("");
      await verifyMarkEntryApi(markEntryId);
      await loadData();
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setVerifyingId("");
    }
  };

  const handleLock = async (markEntryId) => {
    try {
      setLockingId(markEntryId);
      setPageError("");
      await lockMarkEntryApi(markEntryId);
      await loadData();
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setLockingId("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mark Entries"
        subtitle="Search, correct, verify, and lock entered marks"
      />

      <SectionCard
        title="Mark Entry Filters"
        subtitle="Filter by exam session, program, batch, subject, and student"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
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
              <option value="">All Exam Sessions</option>
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
              <option value="">All Programs</option>
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
              <option value="">All Batches</option>
              {batches.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="mb-2 block text-sm font-medium text-[#243447]">
              Subject Search
            </label>
            <input
              type="text"
              value={filters.subjectSearch}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  subjectSearch: event.target.value
                }))
              }
              placeholder="Subject code or name"
              className={inputClass}
            />
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

      {pageError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      <SectionCard
        title="Current Summary"
        subtitle="Summary for filtered mark entries"
      >
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total Rows" value={summary.total} />
          <StatCard label="Draft" value={summary.draft} />
          <StatCard label="Verified" value={summary.verified} />
          <StatCard label="Locked" value={summary.locked} />
        </div>
      </SectionCard>

      <SectionCard
        title="Mark Entry Rows"
        subtitle="Edit carefully. Locked rows cannot be changed."
      >
        {loading ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            Loading mark entries...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            No mark entries found for the selected filters.
          </div>
        ) : (
          <div className="space-y-5">
            {filteredEntries.map((entry) => {
              const draft = editedRows[entry._id] || {
                internalMark: "",
                externalMark: "",
                isAbsent: false,
                isWithheld: false,
                isMalpractice: false
              };

              const isLocked = entry.entryStatus === "LOCKED";
              const disableMarks =
                isLocked ||
                draft.isAbsent ||
                draft.isWithheld ||
                draft.isMalpractice;

              const internalValue =
                draft.internalMark === null || draft.internalMark === undefined
                  ? ""
                  : draft.internalMark;
              const externalValue =
                draft.externalMark === null || draft.externalMark === undefined
                  ? ""
                  : draft.externalMark;

              const totalValue =
                draft.isAbsent || draft.isWithheld || draft.isMalpractice
                  ? 0
                  : (Number(internalValue || 0) + Number(externalValue || 0));

              return (
                <div
                  key={entry._id}
                  className="rounded-3xl border border-[#E6ECF2] bg-[#FBFCFE] p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-[#243447]">
                        {entry?.studentId?.registerNumber || "-"} - {entry?.studentId?.fullName || "-"}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[#6B7A8C]">
                        <span>{entry?.subjectId?.code || "-"}</span>
                        <span>•</span>
                        <span>{entry?.subjectId?.name || "-"}</span>
                        <span>•</span>
                        <span>
                          Internal Max: {entry?.subjectId?.internalMax ?? 0}
                        </span>
                        <span>•</span>
                        <span>
                          External Max: {entry?.subjectId?.externalMax ?? 0}
                        </span>
                        <span>•</span>
                        <span>
                          Exam Session: {entry?.examSessionId?.name || "-"}
                        </span>
                      </div>
                    </div>

                    <StatusBadge status={entry.entryStatus} />
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-6">
                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-medium text-[#243447]">
                        Internal
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={entry?.subjectId?.internalMax ?? undefined}
                        value={toInputValue(internalValue)}
                        disabled={disableMarks}
                        onChange={(event) =>
                          handleRowChange(
                            entry._id,
                            "internalMark",
                            event.target.value === "" ? "" : Number(event.target.value)
                          )
                        }
                        className={inputClass}
                        placeholder="Enter internal mark"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-medium text-[#243447]">
                        External
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={entry?.subjectId?.externalMax ?? undefined}
                        value={toInputValue(externalValue)}
                        disabled={disableMarks}
                        onChange={(event) =>
                          handleRowChange(
                            entry._id,
                            "externalMark",
                            event.target.value === "" ? "" : Number(event.target.value)
                          )
                        }
                        className={inputClass}
                        placeholder="Enter external mark"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-medium text-[#243447]">
                        Total
                      </label>
                      <input
                        type="text"
                        value={String(totalValue)}
                        disabled
                        className={inputClass}
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-[#E2EAF2] bg-white px-4 py-3 text-sm text-[#243447]">
                      <input
                        type="checkbox"
                        checked={Boolean(draft.isAbsent)}
                        disabled={isLocked}
                        onChange={(event) =>
                          handleRowChange(entry._id, "isAbsent", event.target.checked)
                        }
                        className="h-4 w-4"
                      />
                      Absent
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl border border-[#E2EAF2] bg-white px-4 py-3 text-sm text-[#243447]">
                      <input
                        type="checkbox"
                        checked={Boolean(draft.isWithheld)}
                        disabled={isLocked}
                        onChange={(event) =>
                          handleRowChange(entry._id, "isWithheld", event.target.checked)
                        }
                        className="h-4 w-4"
                      />
                      Withheld
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl border border-[#E2EAF2] bg-white px-4 py-3 text-sm text-[#243447]">
                      <input
                        type="checkbox"
                        checked={Boolean(draft.isMalpractice)}
                        disabled={isLocked}
                        onChange={(event) =>
                          handleRowChange(entry._id, "isMalpractice", event.target.checked)
                        }
                        className="h-4 w-4"
                      />
                      Malpractice
                    </label>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => handleSave(entry)}
                      disabled={savingId === entry._id || isLocked}
                      className="rounded-2xl bg-[#7C9CCF] px-5 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF] disabled:opacity-70"
                    >
                      {savingId === entry._id ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVerify(entry._id)}
                      disabled={
                        verifyingId === entry._id || isLocked
                      }
                      className="rounded-2xl border border-[#DCE7F7] bg-white px-5 py-3 text-sm font-medium text-[#4A6A94] hover:bg-[#F8FAFC] disabled:opacity-70"
                    >
                      {verifyingId === entry._id ? "Verifying..." : "Verify"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLock(entry._id)}
                      disabled={
                        lockingId === entry._id ||
                        entry.entryStatus !== "VERIFIED"
                      }
                      className="rounded-2xl border border-[#DCE7F7] bg-white px-5 py-3 text-sm font-medium text-[#4A6A94] hover:bg-[#F8FAFC] disabled:opacity-70"
                    >
                      {lockingId === entry._id ? "Locking..." : "Lock"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}