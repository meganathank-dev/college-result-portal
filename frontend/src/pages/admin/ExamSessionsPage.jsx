import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import Modal from "../../components/common/Modal";
import {
  getExamSessionsApi,
  createExamSessionApi,
  updateExamSessionApi,
  toggleExamSessionStatusApi
} from "../../api/examSessions.api";

const SESSION_CATEGORIES = ["REGULAR", "REVALUATION"];
const MONTH_OPTIONS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC"
];

const emptyForm = {
  name: "",
  examMonth: "",
  examYear: "",
  sessionCategory: "REGULAR",
  parentExamSessionId: "",
  notes: ""
};

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-2 block text-sm font-medium text-[#243447]">
      {children}
      {required ? <span className="ml-1 text-[#C66B5D]">*</span> : null}
    </label>
  );
}

function StatusBadge({ value }) {
  const normalized = String(value || "").toUpperCase().trim();
  const styles =
    normalized === "OPEN"
      ? "bg-[#EEF8F1] text-[#3F7D56] border-[#D6EFD9]"
      : "bg-[#FFF4E8] text-[#9A6A2A] border-[#F1DEC2]";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles}`}
    >
      {normalized || "DRAFT"}
    </span>
  );
}

function CategoryBadge({ value }) {
  const normalized = String(value || "").toUpperCase().trim();
  const styles =
    normalized === "REVALUATION"
      ? "bg-[#FFF1F3] text-[#B54769] border-[#F8D7DF]"
      : "bg-[#EDF3FA] text-[#4A6A94] border-[#DCE7F7]";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles}`}
    >
      {normalized || "-"}
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

const resolveMonthYear = (item) => {
  const month = item?.examMonth || "-";
  const year = item?.examYear || "-";
  return `${month} ${year}`;
};

const resolveParentName = (item) => item?.parentExamSessionId?.name || "-";

export default function ExamSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError("");

      const response = await getExamSessionsApi();
      setSessions(response?.data || []);
    } catch (err) {
      setPageError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableParentSessions = useMemo(() => {
    return sessions.filter((item) => {
      if (editingSession?._id && String(item._id) === String(editingSession._id)) {
        return false;
      }
      return String(item?.sessionCategory || "").toUpperCase() === "REGULAR";
    });
  }, [sessions, editingSession]);

  const filteredSessions = useMemo(() => {
    const term = search.trim().toLowerCase();

    return sessions.filter((item) => {
      const matchesSearch =
        !term ||
        [
          item?.name,
          item?.sessionCategory,
          item?.status,
          item?.examMonth,
          String(item?.examYear || ""),
          resolveParentName(item),
          item?.notes
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesCategory =
        !categoryFilter ||
        String(item?.sessionCategory || "").toUpperCase() === categoryFilter;

      const matchesStatus =
        !statusFilter ||
        String(item?.status || "").toUpperCase() === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [sessions, search, categoryFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingSession(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingSession(item);
    setForm({
      name: item?.name || "",
      examMonth: item?.examMonth || "",
      examYear: item?.examYear ? String(item.examYear) : "",
      sessionCategory: item?.sessionCategory || "REGULAR",
      parentExamSessionId: item?.parentExamSessionId?._id || "",
      notes: item?.notes || ""
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingSession(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "sessionCategory") {
        if (value === "REGULAR") {
          next.parentExamSessionId = "";
        }
        if (value === "REVALUATION") {
          next.examMonth = "";
        }
      }

      return next;
    });
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Session name is required";
    if (!form.examYear || Number.isNaN(Number(form.examYear))) {
      return "Exam year is required";
    }
    if (!form.sessionCategory) return "Session category is required";

    if (form.sessionCategory === "REGULAR" && !form.examMonth) {
      return "Exam month is required for REGULAR session";
    }

    if (form.sessionCategory === "REVALUATION" && !form.parentExamSessionId) {
      return "Parent exam session is required for REVALUATION session";
    }

    return "";
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    examMonth: form.sessionCategory === "REGULAR" ? form.examMonth || null : null,
    examYear: Number(form.examYear),
    sessionCategory: form.sessionCategory,
    parentExamSessionId:
      form.sessionCategory === "REVALUATION" ? form.parentExamSessionId || null : null,
    notes: form.notes.trim()
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = buildPayload();

      if (editingSession?._id) {
        await updateExamSessionApi(editingSession._id, payload);
      } else {
        await createExamSessionApi(payload);
      }

      await loadData();
      closeModal();
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (examSessionId) => {
    try {
      setTogglingId(examSessionId);
      setPageError("");
      await toggleExamSessionStatusApi(examSessionId);
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
        title="Exam Sessions"
        subtitle="Manage common university exam sessions for the whole college"
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-2xl bg-[#7C9CCF] px-4 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF]"
          >
            Add Exam Session
          </button>
        }
      />

      <SectionCard
        title="Exam Session Directory"
        subtitle="Create, review, update, and open exam sessions"
        action={
          <div className="flex w-full min-w-0 flex-col gap-3 xl:w-auto xl:flex-row">
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">All Categories</option>
              {SESSION_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="OPEN">OPEN</option>
            </select>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search exam sessions..."
              className={`xl:w-72 ${inputClass}`}
            />
          </div>
        }
      >
        {loading ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            Loading exam sessions...
          </div>
        ) : pageError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {pageError}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            No exam sessions found.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="min-w-full text-sm">
                <thead className="bg-[#EDF3FA] text-[#243447]">
                  <tr>
                    <th className="px-4 py-3 text-left">Session Name</th>
                    <th className="px-4 py-3 text-left">Month / Year</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Parent Session</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Notes</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((item) => (
                    <tr key={item._id} className="border-t border-[#E6ECF2]">
                      <td className="px-4 py-4 font-medium text-[#243447]">{item.name}</td>
                      <td className="px-4 py-4 text-[#243447]">{resolveMonthYear(item)}</td>
                      <td className="px-4 py-4">
                        <CategoryBadge value={item.sessionCategory} />
                      </td>
                      <td className="px-4 py-4 text-[#243447]">{resolveParentName(item)}</td>
                      <td className="px-4 py-4">
                        <StatusBadge value={item.status} />
                      </td>
                      <td className="max-w-[260px] px-4 py-4 text-[#243447]">
                        <span className="line-clamp-2">{item.notes || "-"}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="rounded-xl border border-[#E6ECF2] px-3 py-2 text-sm font-medium text-[#4A6A94] hover:bg-[#F8FAFC]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item._id)}
                            disabled={togglingId === item._id}
                            className="rounded-xl border border-[#E6ECF2] px-3 py-2 text-sm font-medium text-[#7A5C1E] hover:bg-[#FFF9EE] disabled:opacity-70"
                          >
                            {togglingId === item._id ? "Updating..." : "Toggle Status"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 xl:hidden">
              {filteredSessions.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="truncate text-base font-semibold text-[#243447]">
                        {item.name}
                      </h4>
                      <p className="mt-1 text-sm text-[#6B7A8C]">{resolveMonthYear(item)}</p>
                    </div>

                    <StatusBadge value={item.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <CategoryBadge value={item.sessionCategory} />
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-[#243447]">
                    <p>
                      <span className="font-medium">Parent Session:</span>{" "}
                      {resolveParentName(item)}
                    </p>
                    <p>
                      <span className="font-medium">Notes:</span> {item.notes || "-"}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="rounded-xl border border-[#E6ECF2] px-3 py-2 text-sm font-medium text-[#4A6A94] hover:bg-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item._id)}
                      disabled={togglingId === item._id}
                      className="rounded-xl border border-[#E6ECF2] px-3 py-2 text-sm font-medium text-[#7A5C1E] hover:bg-[#FFF9EE] disabled:opacity-70"
                    >
                      {togglingId === item._id ? "Updating..." : "Toggle Status"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingSession ? "Edit Exam Session" : "Add Exam Session"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="min-w-0">
              <FieldLabel required>Session Name</FieldLabel>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="Nov/Dec 2026 University Examination"
                className={inputClass}
              />
            </div>

            <div className="min-w-0">
              <FieldLabel required>Exam Year</FieldLabel>
              <input
                type="number"
                name="examYear"
                value={form.examYear}
                onChange={handleInputChange}
                placeholder="2026"
                className={inputClass}
              />
            </div>

            <div className="min-w-0">
              <FieldLabel required>Session Category</FieldLabel>
              <select
                name="sessionCategory"
                value={form.sessionCategory}
                onChange={handleInputChange}
                className={inputClass}
              >
                {SESSION_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {form.sessionCategory === "REGULAR" ? (
              <div className="min-w-0">
                <FieldLabel required>Exam Month</FieldLabel>
                <select
                  name="examMonth"
                  value={form.examMonth}
                  onChange={handleInputChange}
                  className={inputClass}
                >
                  <option value="">Select Month</option>
                  {MONTH_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {form.sessionCategory === "REVALUATION" ? (
              <div className="min-w-0 lg:col-span-2">
                <FieldLabel required>Parent Exam Session</FieldLabel>
                <select
                  name="parentExamSessionId"
                  value={form.parentExamSessionId}
                  onChange={handleInputChange}
                  className={inputClass}
                >
                  <option value="">Select Parent Session</option>
                  {availableParentSessions.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="min-w-0 lg:col-span-3">
              <FieldLabel>Notes</FieldLabel>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleInputChange}
                placeholder="Optional notes for this exam session"
                rows={5}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {formError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <div className="sticky bottom-0 flex flex-col gap-3 border-t border-[#EEF2F6] bg-white pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
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
                : editingSession
                  ? "Update Exam Session"
                  : "Create Exam Session"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}