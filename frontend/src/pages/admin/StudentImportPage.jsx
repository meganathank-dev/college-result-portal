import { useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import {
  downloadStudentImportTemplateApi,
  importStudentsApi,
} from "../../api/studentImport.api";

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5">
      <p className="text-sm text-[#6B7A8C]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#243447]">{value}</p>
    </div>
  );
}

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

  return "Import failed";
}

function triggerBrowserDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function StudentBulkImportPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [importResult, setImportResult] = useState(null);

  const acceptedFormats = useMemo(() => ".xlsx,.xls,.csv", []);

  const handleTemplateDownload = async () => {
    try {
      setDownloadingTemplate(true);
      setPageError("");

      const response = await downloadStudentImportTemplateApi();

      const contentDisposition =
        response.headers?.["content-disposition"] || "";
      const matchedName = contentDisposition.match(/filename="?([^"]+)"?/i);
      const filename = matchedName?.[1] || "student-import-template.xlsx";

      triggerBrowserDownload(response.data, filename);
    } catch (err) {
      console.log("TEMPLATE DOWNLOAD ERROR:", err);
      console.log("TEMPLATE DOWNLOAD RESPONSE:", err?.response);
      console.log("TEMPLATE DOWNLOAD DATA:", err?.response?.data);

      setPageError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Template download failed",
      );
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFilePick = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setPageError("");
    setImportResult(null);
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    handleFilePick(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    handleFilePick(file);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setPageError("Please choose a file to import");
      return;
    }

    try {
      setUploading(true);
      setPageError("");
      setImportResult(null);

      const result = await importStudentsApi(selectedFile);
      setImportResult(result?.data || result || null);
    } catch (err) {
      console.log("IMPORT ERROR:", err?.response?.data || err);
      setPageError(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const insertedCount = importResult?.insertedCount ?? 0;
  const skippedCount = importResult?.skippedCount ?? 0;
  const totalCount = importResult?.totalRows ?? insertedCount + skippedCount;
  const insertedStudents = importResult?.insertedStudents || [];
  const skippedRows = importResult?.skippedRows || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Bulk Import"
        subtitle="Upload student records using Excel or CSV templates"
        action={
          <button
            type="button"
            onClick={handleTemplateDownload}
            disabled={downloadingTemplate}
            className="rounded-2xl bg-[#7C9CCF] px-4 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF] disabled:opacity-70"
          >
            {downloadingTemplate ? "Downloading..." : "Download Template"}
          </button>
        }
      />

      <SectionCard
        title="Import Students"
        subtitle="Upload a filled template file and import student records"
      >
        <div className="space-y-5">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`rounded-[28px] border-2 border-dashed p-8 transition ${
              dragActive
                ? "border-[#7C9CCF] bg-[#F7FAFE]"
                : "border-[#D9E4F0] bg-[#FBFCFE]"
            }`}
          >
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <div className="rounded-2xl border border-[#E6ECF2] bg-white px-4 py-2 text-sm text-[#4A6A94]">
                Excel / CSV
              </div>

              <h3 className="mt-4 text-lg font-semibold text-[#243447]">
                Drag and drop your file here
              </h3>

              <p className="mt-2 text-sm text-[#6B7A8C]">
                Supported formats: XLSX, XLS, CSV
              </p>

              <label className="mt-5 inline-flex cursor-pointer rounded-2xl border border-[#E6ECF2] bg-white px-5 py-3 text-sm font-medium text-[#4A6A94] hover:bg-[#F8FAFC]">
                Choose File
                <input
                  type="file"
                  accept={acceptedFormats}
                  onChange={handleInputChange}
                  className="hidden"
                />
              </label>

              {selectedFile ? (
                <div className="mt-5 rounded-2xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm text-[#243447]">
                  Selected file:{" "}
                  <span className="font-medium">{selectedFile.name}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleImport}
              disabled={uploading || !selectedFile}
              className="rounded-2xl bg-[#7C9CCF] px-5 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF] disabled:opacity-70"
            >
              {uploading ? "Importing..." : "Start Import"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setImportResult(null);
                setPageError("");
              }}
              className="rounded-2xl border border-[#E6ECF2] px-5 py-3 text-sm font-medium text-[#4A6A94] hover:bg-[#F8FAFC]"
            >
              Reset
            </button>
          </div>

          {pageError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="Import Summary"
        subtitle="Review the result of the last import operation"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total Rows" value={totalCount} />
          <StatCard label="Inserted" value={insertedCount} />
          <StatCard label="Skipped" value={skippedCount} />
        </div>

        {!importResult ? (
          <div className="mt-5 rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            No import has been run yet.
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {insertedStudents.length > 0 ? (
              <div className="rounded-2xl border border-[#D6EFD9] bg-[#F6FCF7] p-5">
                <h4 className="text-base font-semibold text-[#243447]">
                  Inserted Students
                </h4>

                <div className="mt-4 hidden overflow-x-auto xl:block">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#ECF8EF] text-[#243447]">
                      <tr>
                        <th className="px-4 py-3 text-left">Register Number</th>
                        <th className="px-4 py-3 text-left">Full Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insertedStudents.map((student, index) => (
                        <tr
                          key={student._id || index}
                          className="border-t border-[#D6EFD9]"
                        >
                          <td className="px-4 py-4 text-[#243447]">
                            {student.registerNumber}
                          </td>
                          <td className="px-4 py-4 text-[#243447]">
                            {student.fullName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 grid gap-3 xl:hidden">
                  {insertedStudents.map((student, index) => (
                    <div
                      key={student._id || index}
                      className="rounded-2xl border border-[#D6EFD9] bg-white p-4"
                    >
                      <p className="text-sm font-medium text-[#243447]">
                        {student.registerNumber}
                      </p>
                      <p className="mt-2 text-sm text-[#3F7D56]">
                        {student.fullName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {skippedRows.length > 0 ? (
              <div className="rounded-2xl border border-[#F2D7D2] bg-[#FFF8F6] p-5">
                <h4 className="text-base font-semibold text-[#243447]">
                  Skipped Rows
                </h4>

                <div className="mt-4 hidden overflow-x-auto xl:block">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#FBEDEA] text-[#243447]">
                      <tr>
                        <th className="px-4 py-3 text-left">Row</th>
                        <th className="px-4 py-3 text-left">Register Number</th>
                        <th className="px-4 py-3 text-left">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skippedRows.map((row, index) => (
                        <tr key={index} className="border-t border-[#F2D7D2]">
                          <td className="px-4 py-4 text-[#243447]">
                            {row.rowNumber ?? index + 1}
                          </td>
                          <td className="px-4 py-4 text-[#243447]">
                            {row.registerNumber || "-"}
                          </td>
                          <td className="px-4 py-4 text-[#A14B3B]">
                            {row.reason || "Invalid row"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 grid gap-3 xl:hidden">
                  {skippedRows.map((row, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-[#F2D7D2] bg-white p-4"
                    >
                      <p className="text-sm font-medium text-[#243447]">
                        Row {row.rowNumber ?? index + 1}
                      </p>
                      <p className="mt-1 text-sm text-[#243447]">
                        Register Number: {row.registerNumber || "-"}
                      </p>
                      <p className="mt-2 text-sm text-[#A14B3B]">
                        {row.reason || "Invalid row"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              importResult && (
                <div className="rounded-2xl border border-[#D6EFD9] bg-[#F6FCF7] p-5 text-sm text-[#3F7D56]">
                  No skipped rows found.
                </div>
              )
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
