import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import Modal from "../../components/common/Modal";
import {
  getSemestersApi,
  createSemesterApi,
  updateSemesterApi
} from "../../api/semesters.api";

const emptyForm = {
  number: "",
  label: "",
  status: "ACTIVE"
};

function StatusBadge({ status, isActive }) {
  const resolvedActive =
    typeof isActive === "boolean"
      ? isActive
      : String(status || "").toUpperCase() === "ACTIVE";

  const styles = resolvedActive
    ? "bg-[#EEF8F1] text-[#3F7D56] border-[#D6EFD9]"
    : "bg-[#FFF4E8] text-[#9A6A2A] border-[#F1DEC2]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles}`}>
      {resolvedActive ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}

const resolveSemesterNumber = (semester) => {
  return semester.number ?? semester.semesterNumber ?? "-";
};

const resolveSemesterLabel = (semester) => {
  return semester.label ?? semester.semesterLabel ?? `Semester ${resolveSemesterNumber(semester)}`;
};

export default function SemestersPage() {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadSemesters = async () => {
    try {
      setLoading(true);
      setPageError("");
      const response = await getSemestersApi();
      setSemesters(response?.data || []);
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to load semesters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSemesters();
  }, []);

  const filteredSemesters = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return semesters;

    return semesters.filter((semester) =>
      [
        resolveSemesterLabel(semester),
        String(resolveSemesterNumber(semester)),
        semester.status
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [semesters, search]);

  const openCreateModal = () => {
    setEditingSemester(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (semester) => {
    setEditingSemester(semester);
    setForm({
      number: resolveSemesterNumber(semester) === "-" ? "" : String(resolveSemesterNumber(semester)),
      label: resolveSemesterLabel(semester) || "",
      status: String(semester.status || "ACTIVE").toUpperCase()
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingSemester(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleFormChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  };

  const validateForm = () => {
    if (!form.number) return "Semester number is required";
    if (!form.label.trim()) return "Semester label is required";

    const num = Number(form.number);
    if (Number.isNaN(num) || num < 1) {
      return "Semester number must be a valid positive number";
    }

    return "";
  };

  const buildPayload = () => ({
    number: Number(form.number),
    label: form.label.trim(),
    status: form.status
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

      if (editingSemester?._id) {
        await updateSemesterApi(editingSemester._id, payload);
      } else {
        await createSemesterApi(payload);
      }

      await loadSemesters();
      closeModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save semester");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Semesters"
        subtitle="Manage semester master data used across curriculum and student records"
        action={
          <button
            onClick={openCreateModal}
            className="rounded-2xl bg-[#7C9CCF] px-4 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF]"
          >
            Add Semester
          </button>
        }
      />

      <SectionCard
        title="Semester Directory"
        subtitle="Create, review, and update semester records"
        action={
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search semesters..."
            className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF] sm:w-72"
          />
        }
      >
        {loading ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            Loading semesters...
          </div>
        ) : pageError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {pageError}
          </div>
        ) : filteredSemesters.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            No semesters found.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-sm">
                <thead className="bg-[#EDF3FA] text-[#243447]">
                  <tr>
                    <th className="px-4 py-3 text-left">Semester Number</th>
                    <th className="px-4 py-3 text-left">Label</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSemesters.map((semester) => (
                    <tr key={semester._id} className="border-t border-[#E6ECF2]">
                      <td className="px-4 py-4 font-medium text-[#243447]">
                        {resolveSemesterNumber(semester)}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveSemesterLabel(semester)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={semester.status} isActive={semester.isActive} />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => openEditModal(semester)}
                          className="rounded-xl border border-[#E6ECF2] px-3 py-2 text-sm font-medium text-[#4A6A94] hover:bg-[#F8FAFC]"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 lg:hidden">
              {filteredSemesters.map((semester) => (
                <div
                  key={semester._id}
                  className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-base font-semibold text-[#243447]">
                        {resolveSemesterLabel(semester)}
                      </h4>
                      <p className="mt-1 text-sm text-[#6B7A8C]">
                        Semester {resolveSemesterNumber(semester)}
                      </p>
                    </div>

                    <StatusBadge status={semester.status} isActive={semester.isActive} />
                  </div>

                  <button
                    onClick={() => openEditModal(semester)}
                    className="mt-4 rounded-xl border border-[#E6ECF2] px-3 py-2 text-sm font-medium text-[#4A6A94] hover:bg-white"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingSemester ? "Edit Semester" : "Add Semester"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Semester Number
              </label>
              <input
                type="number"
                name="number"
                value={form.number}
                onChange={handleFormChange}
                placeholder="1"
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleFormChange}
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none focus:border-[#5F7FAF]"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#243447]">
              Semester Label
            </label>
            <input
              type="text"
              name="label"
              value={form.label}
              onChange={handleFormChange}
              placeholder="Semester 1"
              className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
            />
          </div>

          {formError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm font-medium text-[#4A6A94]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-[#7C9CCF] px-4 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF] disabled:opacity-70"
            >
              {saving
                ? "Saving..."
                : editingSemester
                  ? "Update Semester"
                  : "Create Semester"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}