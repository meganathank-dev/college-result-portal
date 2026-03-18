import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import Modal from "../../components/common/Modal";
import {
  getBatchesApi,
  createBatchApi,
  updateBatchApi
} from "../../api/batches.api";

const emptyForm = {
  label: "",
  startYear: "",
  endYear: "",
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

const formatBatchYears = (startYear, endYear) => {
  if (!startYear && !endYear) return "-";
  if (!startYear) return String(endYear);
  if (!endYear) return String(startYear);
  return `${startYear} - ${endYear}`;
};

export default function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadBatches = async () => {
    try {
      setLoading(true);
      setPageError("");
      const response = await getBatchesApi();
      setBatches(response?.data || []);
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const filteredBatches = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return batches;

    return batches.filter((batch) =>
      [
        batch.label,
        String(batch.startYear || ""),
        String(batch.endYear || ""),
        batch.status,
        batch.batchLabel
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [batches, search]);

  const openCreateModal = () => {
    setEditingBatch(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (batch) => {
    setEditingBatch(batch);
    setForm({
      label: batch.label || batch.batchLabel || "",
      startYear: batch.startYear || "",
      endYear: batch.endYear || "",
      status: String(batch.status || "ACTIVE").toUpperCase()
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingBatch(null);
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
    if (!form.label.trim()) return "Batch label is required";
    if (!form.startYear) return "Start year is required";
    if (!form.endYear) return "End year is required";

    if (Number(form.endYear) < Number(form.startYear)) {
      return "End year cannot be less than start year";
    }

    return "";
  };

  const buildPayload = () => ({
    label: form.label.trim(),
    startYear: Number(form.startYear),
    endYear: Number(form.endYear),
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

      if (editingBatch?._id) {
        await updateBatchApi(editingBatch._id, payload);
      } else {
        await createBatchApi(payload);
      }

      await loadBatches();
      closeModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save batch");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        subtitle="Manage student batch year ranges for academic records"
        action={
          <button
            onClick={openCreateModal}
            className="rounded-2xl bg-[#7C9CCF] px-4 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF]"
          >
            Add Batch
          </button>
        }
      />

      <SectionCard
        title="Batch Directory"
        subtitle="Create, review, and update batch year records"
        action={
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search batches..."
            className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF] sm:w-72"
          />
        }
      >
        {loading ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            Loading batches...
          </div>
        ) : pageError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {pageError}
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            No batches found.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-sm">
                <thead className="bg-[#EDF3FA] text-[#243447]">
                  <tr>
                    <th className="px-4 py-3 text-left">Label</th>
                    <th className="px-4 py-3 text-left">Start Year</th>
                    <th className="px-4 py-3 text-left">End Year</th>
                    <th className="px-4 py-3 text-left">Year Range</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.map((batch) => (
                    <tr key={batch._id} className="border-t border-[#E6ECF2]">
                      <td className="px-4 py-4 font-medium text-[#243447]">
                        {batch.label || batch.batchLabel}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">{batch.startYear ?? "-"}</td>
                      <td className="px-4 py-4 text-[#243447]">{batch.endYear ?? "-"}</td>
                      <td className="px-4 py-4 text-[#243447]">
                        {formatBatchYears(batch.startYear, batch.endYear)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={batch.status} isActive={batch.isActive} />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => openEditModal(batch)}
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
              {filteredBatches.map((batch) => (
                <div
                  key={batch._id}
                  className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-base font-semibold text-[#243447]">
                        {batch.label || batch.batchLabel}
                      </h4>
                      <p className="mt-1 text-sm text-[#6B7A8C]">
                        {formatBatchYears(batch.startYear, batch.endYear)}
                      </p>
                    </div>

                    <StatusBadge status={batch.status} isActive={batch.isActive} />
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-[#243447]">
                    <p>
                      <span className="font-medium">Start Year:</span> {batch.startYear ?? "-"}
                    </p>
                    <p>
                      <span className="font-medium">End Year:</span> {batch.endYear ?? "-"}
                    </p>
                  </div>

                  <button
                    onClick={() => openEditModal(batch)}
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
        title={editingBatch ? "Edit Batch" : "Add Batch"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#243447]">
              Batch Label
            </label>
            <input
              type="text"
              name="label"
              value={form.label}
              onChange={handleFormChange}
              placeholder="2023-2027"
              className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Start Year
              </label>
              <input
                type="number"
                name="startYear"
                value={form.startYear}
                onChange={handleFormChange}
                placeholder="2023"
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                End Year
              </label>
              <input
                type="number"
                name="endYear"
                value={form.endYear}
                onChange={handleFormChange}
                placeholder="2027"
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
              />
            </div>
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
                : editingBatch
                  ? "Update Batch"
                  : "Create Batch"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}