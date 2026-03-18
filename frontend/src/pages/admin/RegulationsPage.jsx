import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import Modal from "../../components/common/Modal";
import {
  getRegulationsApi,
  createRegulationApi,
  updateRegulationApi
} from "../../api/regulations.api";

const emptyForm = {
  code: "",
  name: "",
  effectiveFromBatchYear: "",
  effectiveToBatchYear: "",
  isActive: true
};

function StatusBadge({ isActive, status }) {
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

const formatYearRange = (fromYear, toYear) => {
  if (!fromYear && !toYear) return "-";
  if (fromYear && !toYear) return `${fromYear} onwards`;
  return `${fromYear} - ${toYear}`;
};

export default function RegulationsPage() {
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRegulation, setEditingRegulation] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRegulations = async () => {
    try {
      setLoading(true);
      setPageError("");
      const response = await getRegulationsApi();
      setRegulations(response?.data || []);
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to load regulations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegulations();
  }, []);

  const filteredRegulations = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return regulations;

    return regulations.filter((regulation) =>
      [
        regulation.code,
        regulation.name,
        regulation.regulationCode,
        regulation.regulationName,
        regulation.status,
        String(regulation.effectiveFromBatchYear || ""),
        String(regulation.effectiveToBatchYear || ""),
        String(regulation.startBatchYear || ""),
        String(regulation.endBatchYear || "")
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [regulations, search]);

  const openCreateModal = () => {
    setEditingRegulation(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (regulation) => {
    setEditingRegulation(regulation);
    setForm({
      code: regulation.code || regulation.regulationCode || "",
      name: regulation.name || regulation.regulationName || "",
      effectiveFromBatchYear:
        regulation.effectiveFromBatchYear || regulation.startBatchYear || "",
      effectiveToBatchYear:
        regulation.effectiveToBatchYear || regulation.endBatchYear || "",
      isActive:
        typeof regulation.isActive === "boolean"
          ? regulation.isActive
          : String(regulation.status || "").toUpperCase() === "ACTIVE"
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingRegulation(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const validateForm = () => {
    if (!form.code.trim()) return "Regulation code is required";
    if (!form.name.trim()) return "Regulation name is required";
    if (!form.effectiveFromBatchYear) return "Effective from batch year is required";

    if (
      form.effectiveToBatchYear &&
      Number(form.effectiveToBatchYear) < Number(form.effectiveFromBatchYear)
    ) {
      return "Effective to batch year cannot be less than effective from batch year";
    }

    return "";
  };

  const buildPayload = () => ({
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    effectiveFromBatchYear: Number(form.effectiveFromBatchYear),
    effectiveToBatchYear: form.effectiveToBatchYear
      ? Number(form.effectiveToBatchYear)
      : null,
    isActive: Boolean(form.isActive)
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

      if (editingRegulation?._id) {
        await updateRegulationApi(editingRegulation._id, payload);
      } else {
        await createRegulationApi(payload);
      }

      await loadRegulations();
      closeModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save regulation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regulations"
        subtitle="Manage regulation master data and batch applicability"
        action={
          <button
            onClick={openCreateModal}
            className="rounded-2xl bg-[#7C9CCF] px-4 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF]"
          >
            Add Regulation
          </button>
        }
      />

      <SectionCard
        title="Regulation Directory"
        subtitle="Create, review, and update regulation records"
        action={
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search regulations..."
            className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF] sm:w-72"
          />
        }
      >
        {loading ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            Loading regulations...
          </div>
        ) : pageError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {pageError}
          </div>
        ) : filteredRegulations.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            No regulations found.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-sm">
                <thead className="bg-[#EDF3FA] text-[#243447]">
                  <tr>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Regulation Name</th>
                    <th className="px-4 py-3 text-left">Applicable Batch Years</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegulations.map((regulation) => (
                    <tr key={regulation._id} className="border-t border-[#E6ECF2]">
                      <td className="px-4 py-4 font-medium text-[#243447]">
                        {regulation.code || regulation.regulationCode}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {regulation.name || regulation.regulationName}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {formatYearRange(
                          regulation.effectiveFromBatchYear || regulation.startBatchYear,
                          regulation.effectiveToBatchYear || regulation.endBatchYear
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          isActive={regulation.isActive}
                          status={regulation.status}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => openEditModal(regulation)}
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
              {filteredRegulations.map((regulation) => (
                <div
                  key={regulation._id}
                  className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-base font-semibold text-[#243447]">
                        {regulation.name || regulation.regulationName}
                      </h4>
                      <p className="mt-1 text-sm text-[#6B7A8C]">
                        {regulation.code || regulation.regulationCode}
                      </p>
                    </div>

                    <StatusBadge
                      isActive={regulation.isActive}
                      status={regulation.status}
                    />
                  </div>

                  <p className="mt-4 text-sm text-[#243447]">
                    <span className="font-medium">Applicable Batch Years:</span>{" "}
                    {formatYearRange(
                      regulation.effectiveFromBatchYear || regulation.startBatchYear,
                      regulation.effectiveToBatchYear || regulation.endBatchYear
                    )}
                  </p>

                  <button
                    onClick={() => openEditModal(regulation)}
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
        title={editingRegulation ? "Edit Regulation" : "Add Regulation"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Regulation Code
              </label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleFormChange}
                placeholder="R2021"
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-3 rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#243447]">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleFormChange}
                />
                Active Regulation
              </label>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#243447]">
              Regulation Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              placeholder="Regulation 2021"
              className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Effective From Batch Year
              </label>
              <input
                type="number"
                name="effectiveFromBatchYear"
                value={form.effectiveFromBatchYear}
                onChange={handleFormChange}
                placeholder="2021"
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Effective To Batch Year
              </label>
              <input
                type="number"
                name="effectiveToBatchYear"
                value={form.effectiveToBatchYear}
                onChange={handleFormChange}
                placeholder="2024"
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
              />
            </div>
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
                : editingRegulation
                ? "Update Regulation"
                : "Create Regulation"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}