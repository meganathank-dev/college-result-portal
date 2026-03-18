import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PublicLayout from "../../layouts/PublicLayout";

const HistoryMetricCard = ({ label, value }) => (
  <div className="rounded-2xl border border-[#E6ECF2] p-4">
    <p className="text-xs text-[#6B7A8C]">{label}</p>
    <p className="mt-2 text-lg font-bold text-[#243447]">{value}</p>
  </div>
);

export default function ResultHistoryPage() {
  const navigate = useNavigate();

  const historyData = useMemo(() => {
    const raw = sessionStorage.getItem("published_result_history");
    return raw ? JSON.parse(raw) : null;
  }, []);

  if (!historyData) {
    return (
      <PublicLayout>
        <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
          <h2 className="text-2xl font-bold text-[#243447]">Result History</h2>
          <p className="mt-2 text-sm text-[#6B7A8C]">
            No history data found. Search again from the result page.
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
              <h2 className="text-2xl font-bold text-[#243447]">Published Result History</h2>
              <p className="mt-2 text-sm text-[#6B7A8C]">
                Semester-wise published academic history
              </p>
            </div>

            <button
              onClick={() => navigate("/results")}
              className="rounded-2xl border border-[#E6ECF2] bg-white px-4 py-3 font-medium text-[#4A6A94]"
            >
              New Search
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
          <h3 className="text-lg font-semibold text-[#243447]">Student Details</h3>
          <div className="mt-4 space-y-2 text-sm text-[#243447]">
            <p><span className="font-semibold">Register Number:</span> {historyData.student?.registerNumber}</p>
            <p><span className="font-semibold">Name:</span> {historyData.student?.fullName}</p>
            <p><span className="font-semibold">Department:</span> {historyData.student?.department?.name || "-"}</p>
            <p><span className="font-semibold">Program:</span> {historyData.student?.program?.name || "-"}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
          <h3 className="text-lg font-semibold text-[#243447]">Overall Arrear Summary</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:max-w-md">
            <HistoryMetricCard
              label="Pending Arrears"
              value={historyData.arrearSummary?.totalPendingArrears ?? "-"}
            />
            <HistoryMetricCard
              label="Cleared Arrears"
              value={historyData.arrearSummary?.totalClearedArrears ?? "-"}
            />
          </div>
        </div>

        <div className="space-y-4">
          {historyData.history?.map((item, index) => (
            <div
              key={index}
              className="rounded-3xl border border-[#E6ECF2] bg-white p-6 shadow-[0_10px_30px_rgba(95,127,175,0.08)]"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#243447]">
                    {item.examSession?.name || "Exam Session"}
                  </h3>
                  <p className="text-sm text-[#6B7A8C]">
                    {item.examSession?.examMonth || "-"} {item.examSession?.examYear || ""}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#EDF3FA] px-4 py-2 text-sm font-medium text-[#4A6A94]">
                  {item.summary?.semester?.label || "-"}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <HistoryMetricCard label="GPA" value={item.summary?.gpa ?? "-"} />
                <HistoryMetricCard label="CGPA" value={item.summary?.cgpa ?? "-"} />
                <HistoryMetricCard
                  label="Passed Subjects"
                  value={item.summary?.totalPassedSubjects ?? "-"}
                />
                <HistoryMetricCard
                  label="Failed Subjects"
                  value={item.summary?.totalFailedSubjects ?? "-"}
                />
                <HistoryMetricCard
                  label="Earned Credits"
                  value={item.summary?.totalEarnedCredits ?? "-"}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}