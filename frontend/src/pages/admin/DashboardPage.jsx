import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { getDashboardStatsApi } from "../../api/dashboard.api";

const StatCard = ({ title, value, subtitle }) => (
  <div className="rounded-3xl border border-[#E6ECF2] bg-white p-5 shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
    <p className="text-sm text-[#6B7A8C]">{title}</p>
    <h3 className="mt-2 text-2xl font-bold text-[#243447]">{value}</h3>
    {subtitle ? <p className="mt-2 text-xs text-[#6B7A8C]">{subtitle}</p> : null}
  </div>
);

const QuickActionCard = ({ title, description, onClick }) => (
  <button
    onClick={onClick}
    className="w-full rounded-3xl border border-[#E6ECF2] bg-white p-5 text-left shadow-[0_10px_30px_rgba(95,127,175,0.08)] transition hover:border-[#C8D7EA] hover:bg-[#FBFCFE]"
  >
    <h3 className="text-base font-semibold text-[#243447]">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-[#6B7A8C]">{description}</p>
  </button>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getDashboardStatsApi();
        setStats(response?.data || null);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Workflow-first overview of the college result system"
      />

      {loading ? (
        <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 text-[#6B7A8C] shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
          Loading dashboard...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard title="Total Students" value={stats?.totalStudents ?? 0} />
            <StatCard title="Total Subjects" value={stats?.totalSubjects ?? 0} />
            <StatCard title="Exam Sessions" value={stats?.totalExamSessions ?? 0} />
            <StatCard title="Mark Entries" value={stats?.totalMarkEntries ?? 0} />
            <StatCard title="Processed Results" value={stats?.totalProcessedResults ?? 0} />
            <StatCard
              title="Published Snapshots"
              value={stats?.totalPublishedSnapshots ?? 0}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
              <h3 className="text-lg font-semibold text-[#243447]">Latest Published Session</h3>

              {stats?.latestPublishedSession ? (
                <div className="mt-4 space-y-3 text-sm text-[#243447]">
                  <p>
                    <span className="font-semibold">Name:</span>{" "}
                    {stats.latestPublishedSession.name}
                  </p>
                  <p>
                    <span className="font-semibold">Month:</span>{" "}
                    {stats.latestPublishedSession.examMonth || "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Year:</span>{" "}
                    {stats.latestPublishedSession.examYear || "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Category:</span>{" "}
                    {stats.latestPublishedSession.sessionCategory || "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span>{" "}
                    {stats.latestPublishedSession.status || "-"}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#6B7A8C]">
                  No published session found yet.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
              <h3 className="text-lg font-semibold text-[#243447]">Workflow Guidance</h3>
              <div className="mt-4 space-y-3 text-sm text-[#6B7A8C]">
                <div className="rounded-2xl bg-[#F4F8FC] p-4">
                  Complete academic setup before student onboarding.
                </div>
                <div className="rounded-2xl bg-[#F4F8FC] p-4">
                  Create exam session → register papers → enter marks → verify → lock.
                </div>
                <div className="rounded-2xl bg-[#F4F8FC] p-4">
                  Process results only after mark entries are locked, then publish.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
            <h3 className="text-lg font-semibold text-[#243447]">Quick Actions</h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <QuickActionCard
                title="Manage Students"
                description="Create and maintain student records before exam workflow starts."
                onClick={() => navigate("/admin/students")}
              />
              <QuickActionCard
                title="Exam Sessions"
                description="Create regular or revaluation exam sessions for the current cycle."
                onClick={() => navigate("/admin/exams/sessions")}
              />
              <QuickActionCard
                title="Mark Entries"
                description="Enter, verify, and lock marks for current and arrear registrations."
                onClick={() => navigate("/admin/exams/marks")}
              />
              <QuickActionCard
                title="Publish Results"
                description="Process results and publish them for student access."
                onClick={() => navigate("/admin/results/publish")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}