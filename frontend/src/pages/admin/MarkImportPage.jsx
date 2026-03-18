import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import { getExamSessionsApi } from "../../api/examSessions.api";
import { getProgramsApi } from "../../api/programs.api";
import { getBatchesApi } from "../../api/batches.api";
import {
  getMarkImportCandidatesApi,
  getMarkImportSubjectsApi,
  importMarkEntriesApi,
} from "../../api/markImport.api";

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

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return ["true", "yes", "y", "1"].includes(normalized);
}

export default function MarkImportPage() {
  const [examSessions, setExamSessions] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [candidates, setCandidates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const [pageError, setPageError] = useState("");
  const [importSummary, setImportSummary] = useState(null);

  const [filters, setFilters] = useState({
    examSessionId: "",
    programId: "",
    batchId: "",
    subjectSearch: "",
    subjectId: "",
  });

  const [selectedFileName, setSelectedFileName] = useState("");
  const [parsedRows, setParsedRows] = useState([]);

  const loadMasters = async () => {
    try {
      setLoading(true);
      setPageError("");

      const [examSessionsResponse, programsResponse, batchesResponse] =
        await Promise.all([
          getExamSessionsApi(),
          getProgramsApi(),
          getBatchesApi(),
        ]);

      setExamSessions(examSessionsResponse?.data || []);
      setPrograms(programsResponse?.data || []);
      setBatches(batchesResponse?.data || []);
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasters();
  }, []);

  const canLoadSubjects =
    filters.examSessionId && filters.programId && filters.batchId;

  const selectedSubject = useMemo(
    () =>
      subjects.find((item) => String(item._id) === String(filters.subjectId)) ||
      null,
    [subjects, filters.subjectId],
  );

  const handleLoadSubjects = async () => {
    if (!canLoadSubjects) {
      setPageError("Exam session, program, and batch are required");
      return;
    }

    try {
      setSubjectsLoading(true);
      setPageError("");
      setSubjects([]);
      setCandidates([]);
      setFilters((prev) => ({ ...prev, subjectId: "" }));

      const response = await getMarkImportSubjectsApi({
        examSessionId: filters.examSessionId,
        programId: filters.programId,
        batchId: filters.batchId,
        subjectSearch: filters.subjectSearch || undefined,
      });

      setSubjects(response?.data || []);
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleLoadCandidates = async () => {
    if (
      !filters.examSessionId ||
      !filters.programId ||
      !filters.batchId ||
      !filters.subjectId
    ) {
      setPageError("Exam session, program, batch, and subject are required");
      return;
    }

    try {
      setCandidatesLoading(true);
      setPageError("");
      setImportSummary(null);

      const response = await getMarkImportCandidatesApi({
        examSessionId: filters.examSessionId,
        programId: filters.programId,
        batchId: filters.batchId,
        subjectId: filters.subjectId,
      });

      setCandidates(response?.data || []);
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!selectedSubject || candidates.length === 0) {
      setPageError("Load subject candidates before downloading template");
      return;
    }

    const rows = candidates.map((item) => ({
      "Register Number": item.registerNumber,
      "Subject Code": item.subjectCode,
      "Subject Name": item.subjectName,
      "Internal Marks": item.internalMark ?? "",
      "External Marks": item.externalMark ?? "",
      Total: item.totalMark ?? "",
      Absent: item.isAbsent ? "TRUE" : "FALSE",
      Withheld: item.isWithheld ? "TRUE" : "FALSE",
      Malpractice: item.isMalpractice ? "TRUE" : "FALSE",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mark Import Template");

    const safeSubjectCode = String(selectedSubject.code || "subject").replace(
      /[^A-Za-z0-9_-]/g,
      "_",
    );
    XLSX.writeFile(workbook, `mark_import_${safeSubjectCode}.xlsx`);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSelectedFileName(file.name);
      setPageError("");
      setImportSummary(null);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        setParsedRows([]);
        setPageError("Uploaded file does not contain any sheet");
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      const mappedRows = rawRows.map((row) => ({
        registerNumber: String(row["Register Number"] || "").trim(),
        subjectCode: String(row["Subject Code"] || "").trim(),
        subjectName: String(row["Subject Name"] || "").trim(),
        internalMark:
          row["Internal Marks"] === ""
            ? undefined
            : Number(row["Internal Marks"]),
        externalMark:
          row["External Marks"] === ""
            ? undefined
            : Number(row["External Marks"]),
        total: row["Total"] === "" ? undefined : Number(row["Total"]),
        absent: normalizeBoolean(row["Absent"]),
        withheld: normalizeBoolean(row["Withheld"]),
        malpractice: normalizeBoolean(row["Malpractice"]),
      }));

      setParsedRows(mappedRows);
    } catch {
      setParsedRows([]);
      setPageError("Unable to read the uploaded file");
    }
  };

  const handleImport = async () => {
    if (
      !filters.examSessionId ||
      !filters.programId ||
      !filters.batchId ||
      !filters.subjectId
    ) {
      setPageError("Exam session, program, batch, and subject are required");
      return;
    }

    if (parsedRows.length === 0) {
      setPageError("Choose a filled template file to import");
      return;
    }

    try {
      setImporting(true);
      setPageError("");
      setImportSummary(null);

      const response = await importMarkEntriesApi({
        examSessionId: filters.examSessionId,
        programId: filters.programId,
        batchId: filters.batchId,
        subjectId: filters.subjectId,
        rows: parsedRows,
      });

      setImportSummary(response?.data || null);
      await handleLoadCandidates();
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mark Import"
        subtitle="Import marks subject-wise using Excel template"
      />

      <SectionCard
        title="Import Filters"
        subtitle="Select exact exam session, program, batch, and subject"
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
                  examSessionId: event.target.value,
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
                  programId: event.target.value,
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
                setFilters((prev) => ({ ...prev, batchId: event.target.value }))
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
              Subject Search
            </label>
            <input
              type="text"
              value={filters.subjectSearch}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  subjectSearch: event.target.value,
                }))
              }
              placeholder="Search subject code or name"
              className={inputClass}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleLoadSubjects}
              disabled={loading || subjectsLoading}
              className="w-full rounded-2xl bg-[#7C9CCF] px-5 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF] disabled:opacity-70"
            >
              {subjectsLoading ? "Loading..." : "Load Subjects"}
            </button>
          </div>
        </div>

        {subjects.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map((subject) => {
              const isActive =
                String(filters.subjectId) === String(subject._id);

              return (
                <button
                  key={subject._id}
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, subjectId: subject._id }))
                  }
                  className={`rounded-3xl border p-5 text-left transition ${
                    isActive
                      ? "border-[#CFE0F6] bg-[#F4F8FD] shadow-sm"
                      : "border-[#E6ECF2] bg-white hover:bg-[#FAFCFE]"
                  }`}
                >
                  <h3 className="text-base font-semibold text-[#243447]">
                    {subject.code} - {subject.name}
                  </h3>
                  <p className="mt-2 text-sm text-[#6B7A8C]">
                    Registered Students: {subject.registeredCount}
                  </p>
                  <p className="mt-1 text-sm text-[#6B7A8C]">
                    Max: {subject.internalMax} + {subject.externalMax} ={" "}
                    {subject.totalMax}
                  </p>
                </button>
              );
            })}
          </div>
        ) : null}

        {filters.subjectId ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleLoadCandidates}
              disabled={candidatesLoading}
              className="rounded-2xl border border-[#DCE7F7] bg-white px-5 py-3 text-sm font-medium text-[#4A6A94] hover:bg-[#F8FAFC] disabled:opacity-70"
            >
              {candidatesLoading ? "Loading..." : "Load Registered Students"}
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={candidates.length === 0}
              className="rounded-2xl bg-[#7C9CCF] px-5 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF] disabled:opacity-70"
            >
              Download Template
            </button>
          </div>
        ) : null}
      </SectionCard>

      {pageError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      {candidates.length > 0 ? (
        <SectionCard
          title="Mark Import File"
          subtitle="Upload the filled subject-wise mark template"
        >
          <div className="rounded-3xl border-2 border-dashed border-[#D9E4F0] bg-[#FBFCFE] p-8">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <div className="rounded-2xl border border-[#E6ECF2] bg-white px-4 py-2 text-sm text-[#4A6A94]">
                Excel Import
              </div>

              <h3 className="mt-4 text-lg font-semibold text-[#243447]">
                Upload completed mark sheet
              </h3>

              <p className="mt-2 text-sm text-[#6B7A8C]">
                Fill the downloaded template and upload it here.
              </p>

              <label className="mt-5 inline-flex cursor-pointer rounded-2xl border border-[#E6ECF2] bg-white px-5 py-3 text-sm font-medium text-[#4A6A94] hover:bg-[#F8FAFC]">
                Choose File
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {selectedFileName ? (
                <div className="mt-5 rounded-2xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm text-[#243447]">
                  Selected file:{" "}
                  <span className="font-medium">{selectedFileName}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || parsedRows.length === 0}
              className="rounded-2xl bg-[#7C9CCF] px-5 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF] disabled:opacity-70"
            >
              {importing ? "Importing..." : "Start Import"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedFileName("");
                setParsedRows([]);
                setImportSummary(null);
                setPageError("");
              }}
              className="rounded-2xl border border-[#E6ECF2] px-5 py-3 text-sm font-medium text-[#4A6A94] hover:bg-[#F8FAFC]"
            >
              Reset
            </button>
          </div>
        </SectionCard>
      ) : null}

      {importSummary ? (
        <SectionCard
          title="Import Summary"
          subtitle="Review the result of the latest mark import"
        >
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Total Rows" value={importSummary.totalRows ?? 0} />
            <StatCard label="Saved" value={importSummary.savedCount ?? 0} />
            <StatCard label="Created" value={importSummary.createdCount ?? 0} />
            <StatCard label="Updated" value={importSummary.updatedCount ?? 0} />
          </div>

          {importSummary.failedRows?.length > 0 ? (
            <div className="mt-6 rounded-3xl border border-[#F2D7D2] bg-[#FFF8F6] p-5">
              <h4 className="text-base font-semibold text-[#243447]">
                Failed Rows
              </h4>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#FBEDEA] text-[#243447]">
                    <tr>
                      <th className="px-4 py-3 text-left">Row</th>
                      <th className="px-4 py-3 text-left">Register No</th>
                      <th className="px-4 py-3 text-left">Subject Code</th>
                      <th className="px-4 py-3 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importSummary.failedRows.map((row, index) => (
                      <tr key={index} className="border-t border-[#F2D7D2]">
                        <td className="px-4 py-4">
                          {row.rowNumber ?? index + 1}
                        </td>
                        <td className="px-4 py-4">
                          {row.registerNumber || "-"}
                        </td>
                        <td className="px-4 py-4">{row.subjectCode || "-"}</td>
                        <td className="px-4 py-4 text-[#A14B3B]">
                          {row.reason || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {candidates.length > 0 ? (
        <SectionCard
          title="Registered Students for Selected Subject"
          subtitle="Only registered students are shown for this subject"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#EDF3FA] text-[#243447]">
                <tr>
                  <th className="px-4 py-3 text-left">Register No</th>
                  <th className="px-4 py-3 text-left">Student Name</th>
                  <th className="px-4 py-3 text-left">Subject Code</th>
                  <th className="px-4 py-3 text-left">Subject Name</th>
                  <th className="px-4 py-3 text-left">Current Marks</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((item) => (
                  <tr
                    key={item.examRegistrationId}
                    className="border-t border-[#E6ECF2]"
                  >
                    <td className="px-4 py-4 font-medium text-[#243447]">
                      {item.registerNumber}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item.fullName}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item.subjectCode}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item.subjectName}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item.internalMark ?? "-"} / {item.externalMark ?? "-"} /{" "}
                      {item.totalMark ?? "-"}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item.entryStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
