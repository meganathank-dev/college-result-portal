import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import { getExamSessionsApi } from "../../api/examSessions.api";
import {
  getPublishSnapshotsApi,
  publishExamSessionApi
} from "../../api/publishWorkflow.api";

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

function SnapshotStatusBadge({ status }) {
  const value = String(status || "").toUpperCase();

  const classMap = {
    ACTIVE: "border-[#BFE3C8] bg-[#F2FBF4] text-[#2E7D32]",
    SUPERSEDED: "border-[#D6DDF5] bg-[#F4F7FD] text-[#4B5F8A]"
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

export default function PublishWorkflowPage() {
  const [examSessions, setExamSessions] = useState([]);
  const [snapshots, setSnapshots] = useState([]);

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [pageError, setPageError] = useState("");

  const [form, setForm] = useState({
    examSessionId: "",
    notes: ""
  });

  const [filters, setFilters] = useState({
    sessionSearch: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError("");

      const [examSessionsResponse, snapshotsResponse] = await Promise.all([
        getExamSessionsApi(),
        getPublishSnapshotsApi()
      ]);

      setExamSessions(examSessionsResponse?.data || []);
      setSnapshots(snapshotsResponse?.data || []);
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePublish = async () => {
    if (!form.examSessionId) {
      setPageError("Exam session is required");
      return;
    }

    try {
      setPublishing(true);
      setPageError("");

      await publishExamSessionApi({
        examSessionId: form.examSessionId,
        notes: form.notes
      });

      setForm((prev) => ({
        ...prev,
        notes: ""
      }));

      await loadData();
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setPublishing(false);
    }
  };

  const filteredSnapshots = useMemo(() => {
    const search = filters.sessionSearch.trim().toLowerCase();

    return snapshots.filter((item) => {
      if (!search) return true;

      return [
        item?.examSessionId?.name,
        item?.examSessionId?.examMonth,
        item?.examSessionId?.examYear,
        item?.publishedBy?.fullName
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [snapshots, filters.sessionSearch]);

  const summary = useMemo(() => {
    return {
      totalSnapshots: filteredSnapshots.length,
      activeSnapshots: filteredSnapshots.filter((item) => item.status === "ACTIVE").length,
      supersededSnapshots: filteredSnapshots.filter((item) => item.status === "SUPERSEDED").length,
      totalPublishedStudents: filteredSnapshots.reduce(
        (sum, item) => sum + Number(item.totalStudents || 0),
        0
      )
    };
  }, [filteredSnapshots]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publish Workflow"
        subtitle="Publish processed results and maintain publish snapshot history"
      />

      <SectionCard
        title="Publish Exam Session"
        subtitle="Publish processed results for a selected exam session"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <div className="min-w-0">
            <label className="mb-2 block text-sm font-medium text-[#243447]">
              Exam Session
            </label>
            <select
              value={form.examSessionId}
              onChange={(event) =>
                setForm((prev) => ({
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
              Notes
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  notes: event.target.value
                }))
              }
              placeholder="Optional publish notes"
              className={inputClass}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing || !form.examSessionId}
              className="rounded-2xl bg-[#7C9CCF] px-5 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF] disabled:opacity-70"
            >
              {publishing ? "Publishing..." : "Publish Results"}
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
        title="Publish Summary"
        subtitle="Overview of publish snapshot history"
      >
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total Snapshots" value={summary.totalSnapshots} />
          <StatCard label="Active Snapshots" value={summary.activeSnapshots} />
          <StatCard label="Superseded" value={summary.supersededSnapshots} />
          <StatCard label="Published Students" value={summary.totalPublishedStudents} />
        </div>
      </SectionCard>

      <SectionCard
        title="Publish Snapshot Filters"
        subtitle="Search snapshot history"
      >
        <div className="grid grid-cols-1 gap-4">
          <div className="min-w-0">
            <label className="mb-2 block text-sm font-medium text-[#243447]">
              Search
            </label>
            <input
              type="text"
              value={filters.sessionSearch}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  sessionSearch: event.target.value
                }))
              }
              placeholder="Exam session, month, year, or published by"
              className={inputClass}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Publish Snapshot History"
        subtitle="Published versions and status history"
      >
        {loading ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            Loading publish snapshots...
          </div>
        ) : filteredSnapshots.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            No publish snapshots found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#EDF3FA] text-[#243447]">
                <tr>
                  <th className="px-4 py-3 text-left">Exam Session</th>
                  <th className="px-4 py-3 text-left">Version</th>
                  <th className="px-4 py-3 text-left">Published By</th>
                  <th className="px-4 py-3 text-left">Published At</th>
                  <th className="px-4 py-3 text-left">Students</th>
                  <th className="px-4 py-3 text-left">Subjects</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredSnapshots.map((item) => (
                  <tr key={item._id} className="border-t border-[#E6ECF2] bg-white">
                    <td className="px-4 py-4 font-medium text-[#243447]">
                      {item?.examSessionId?.name || "-"}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item?.snapshotVersion ?? "-"}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item?.publishedBy?.fullName || "-"}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item?.publishedAt
                        ? new Date(item.publishedAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item?.totalStudents ?? 0}
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item?.totalSubjects ?? 0}
                    </td>
                    <td className="px-4 py-4">
                      <SnapshotStatusBadge status={item?.status} />
                    </td>
                    <td className="px-4 py-4 text-[#243447]">
                      {item?.notes || "-"}
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