import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PublicLayout from "../../layouts/PublicLayout";
import { downloadPublishedResultPdfApi } from "../../api/publicResults.api";

const InfoCard = ({ title, children }) => (
  <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
    <h3 className="text-lg font-semibold text-[#243447]">{title}</h3>
    <div className="mt-4 space-y-2 text-sm text-[#243447]">{children}</div>
  </div>
);

const SummaryCard = ({ label, value }) => (
  <div className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-4">
    <p className="text-xs text-[#6B7A8C]">{label}</p>
    <p className="mt-2 text-lg font-bold text-[#243447]">{value}</p>
  </div>
);

export default function ResultViewPage() {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);

  const resultData = useMemo(() => {
    const raw = sessionStorage.getItem("latest_published_result");
    return raw ? JSON.parse(raw) : null;
  }, []);

  const handleDownloadPdf = async () => {
    if (!resultData?.student?.registerNumber) return;

    const storedPayloadRaw = sessionStorage.getItem("last_result_search_payload");
    const payload = storedPayloadRaw ? JSON.parse(storedPayloadRaw) : null;

    if (!payload) return;

    try {
      setDownloading(true);

      const blob = await downloadPublishedResultPdfApi(payload);
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `${resultData.student.registerNumber}_grade_sheet.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  if (!resultData) {
    return (
      <PublicLayout>
        <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
          <h2 className="text-2xl font-bold text-[#243447]">Published Result</h2>
          <p className="mt-2 text-sm text-[#6B7A8C]">
            No result data found. Search again from the result page.
          </p>
          <button
            onClick={() => navigate("/results")}
            className="mt-4 rounded-2xl bg-[#7C9CCF] px-4 py-2 text-white"
          >
            Go Back
          </button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#243447]">Latest Published Result</h2>
              <p className="mt-2 text-sm text-[#6B7A8C]">
                Grade-only view for the latest published exam session
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/results")}
                className="rounded-2xl border border-[#E6ECF2] bg-white px-4 py-3 font-medium text-[#4A6A94]"
              >
                New Search
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="rounded-2xl bg-[#7C9CCF] px-4 py-3 font-medium text-white hover:bg-[#5F7FAF] disabled:opacity-70"
              >
                {downloading ? "Downloading..." : "Download Grade Sheet PDF"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <InfoCard title="Student Details">
            <p><span className="font-semibold">Register Number:</span> {resultData.student.registerNumber}</p>
            <p><span className="font-semibold">Name:</span> {resultData.student.fullName}</p>
            <p><span className="font-semibold">Department:</span> {resultData.student.department?.name || "-"}</p>
            <p><span className="font-semibold">Program:</span> {resultData.student.program?.name || "-"}</p>
            <p><span className="font-semibold">Regulation:</span> {resultData.student.regulation?.name || "-"}</p>
            <p><span className="font-semibold">Batch:</span> {resultData.student.batch?.label || "-"}</p>
            <p><span className="font-semibold">Current Semester:</span> {resultData.student.currentSemester?.label || "-"}</p>
          </InfoCard>

          <InfoCard title="Exam Session">
            <p><span className="font-semibold">Session:</span> {resultData.examSession?.name || "-"}</p>
            <p><span className="font-semibold">Month:</span> {resultData.examSession?.examMonth || "-"}</p>
            <p><span className="font-semibold">Year:</span> {resultData.examSession?.examYear || "-"}</p>
            <p><span className="font-semibold">Category:</span> {resultData.examSession?.sessionCategory || "-"}</p>
          </InfoCard>
        </div>

        <div className="rounded-3xl border border-[#E6ECF2] bg-white shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
          <div className="border-b border-[#E6ECF2] px-6 py-4">
            <h3 className="text-lg font-semibold text-[#243447]">Subject-wise Grade Details</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#EDF3FA] text-[#243447]">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Subject</th>
                  <th className="px-4 py-3 text-left">Sem</th>
                  <th className="px-4 py-3 text-left">Attempt</th>
                  <th className="px-4 py-3 text-left">Result</th>
                  <th className="px-4 py-3 text-left">Grade</th>
                  <th className="px-4 py-3 text-left">GP</th>
                </tr>
              </thead>
              <tbody>
                {resultData.subjectResults?.map((item, index) => (
                  <tr
                    key={`${item.subjectCode}-${index}`}
                    className="border-t border-[#E6ECF2]"
                  >
                    <td className="px-4 py-3">{item.subjectCode}</td>
                    <td className="px-4 py-3">{item.subjectName}</td>
                    <td className="px-4 py-3">{item.sourceSemester?.label || "-"}</td>
                    <td className="px-4 py-3">
                      {item.attemptType} {item.attemptNumber}
                    </td>
                    <td className="px-4 py-3">{item.result}</td>
                    <td className="px-4 py-3">{item.grade}</td>
                    <td className="px-4 py-3">{item.gradePoint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
            <h3 className="text-lg font-semibold text-[#243447]">Academic Summary</h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SummaryCard label="GPA" value={resultData.summary?.gpa ?? "-"} />
              <SummaryCard label="CGPA" value={resultData.summary?.cgpa ?? "-"} />
              <SummaryCard
                label="Registered Subjects"
                value={resultData.summary?.totalRegisteredSubjects ?? "-"}
              />
              <SummaryCard
                label="Passed Subjects"
                value={resultData.summary?.totalPassedSubjects ?? "-"}
              />
              <SummaryCard
                label="Failed Subjects"
                value={resultData.summary?.totalFailedSubjects ?? "-"}
              />
              <SummaryCard
                label="Earned Credits"
                value={resultData.summary?.totalEarnedCredits ?? "-"}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
            <h3 className="text-lg font-semibold text-[#243447]">Arrear Summary</h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SummaryCard
                label="Pending Arrears"
                value={resultData.arrearSummary?.totalPendingArrears ?? "-"}
              />
              <SummaryCard
                label="Cleared Arrears"
                value={resultData.arrearSummary?.totalClearedArrears ?? "-"}
              />
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}