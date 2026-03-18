import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import Modal from "../../components/common/Modal";
import { getRegulationsApi } from "../../api/regulations.api";
import {
  getGradingPoliciesApi,
  createGradingPolicyApi,
  updateGradingPolicyApi
} from "../../api/gradingPolicies.api";

const SUBJECT_TYPES = [
  "THEORY",
  "LABORATORY",
  "THEORY_CUM_LAB",
  "PROJECT",
  "PRACTICAL",
  "ELECTIVE",
  "OPEN_ELECTIVE",
  "PROFESSIONAL_ELECTIVE",
  "MANDATORY",
  "NON_CGPA"
];

const FORMULA_TYPES = ["CBCS"];

const emptyForm = {
  regulationId: "",
  subjectType: "THEORY",
  internalMax: "",
  externalMax: "",
  totalMax: "",
  internalMin: "",
  externalMin: "",
  totalMin: "",
  gpaFormulaType: "CBCS",
  cgpaFormulaType: "CBCS",
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
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles}`}
    >
      {resolvedActive ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}

function TypeBadge({ value }) {
  return (
    <span className="inline-flex rounded-full border border-[#DCE7F7] bg-[#EDF3FA] px-3 py-1 text-xs font-medium text-[#4A6A94]">
      {value || "-"}
    </span>
  );
}

const resolveRegulationId = (policy) =>
  String(policy?.regulationId?._id || policy?.regulationId || policy?.regulation || "");

const resolveRegulationName = (policy, regulationMap) => {
  if (policy?.regulationId?.name) return policy.regulationId.name;
  if (policy?.regulationId?.regulationName) return policy.regulationId.regulationName;

  const regulation = regulationMap.get(resolveRegulationId(policy));
  return (
    regulation?.name ||
    regulation?.regulationName ||
    regulation?.code ||
    regulation?.regulationCode ||
    "-"
  );
};

const resolveSubjectType = (policy) =>
  policy?.subjectType || policy?.applicableSubjectType || policy?.type || "-";

const resolveInternalMax = (policy) =>
  policy?.internalMax ?? policy?.maximumInternalMark ?? 0;

const resolveExternalMax = (policy) =>
  policy?.externalMax ?? policy?.maximumExternalMark ?? 0;

const resolveTotalMax = (policy) =>
  policy?.totalMax ?? policy?.maximumTotalMark ?? 0;

const resolveInternalMin = (policy) =>
  policy?.internalMin ?? policy?.minInternalMark ?? 0;

const resolveExternalMin = (policy) =>
  policy?.externalMin ?? policy?.minExternalMark ?? 0;

const resolveTotalMin = (policy) =>
  policy?.totalMin ?? policy?.minTotalMark ?? 0;

const resolveGradeRuleCount = (policy) =>
  Array.isArray(policy?.gradeRules) ? policy.gradeRules.length : 0;

const resolvePolicyTitle = (policy, regulationMap) => {
  const regulationName = resolveRegulationName(policy, regulationMap);
  const subjectType = resolveSubjectType(policy);
  return `${regulationName} - ${subjectType}`;
};

export default function GradingPoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");
  const [regulationFilter, setRegulationFilter] = useState("");
  const [subjectTypeFilter, setSubjectTypeFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError("");

      const [policyResponse, regulationResponse] = await Promise.all([
        getGradingPoliciesApi(),
        getRegulationsApi()
      ]);

      setPolicies(policyResponse?.data || []);
      setRegulations(regulationResponse?.data || []);
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to load grading policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const regulationMap = useMemo(() => {
    const map = new Map();
    regulations.forEach((regulation) => {
      map.set(String(regulation._id), regulation);
    });
    return map;
  }, [regulations]);

  const filteredPolicies = useMemo(() => {
    const term = search.trim().toLowerCase();

    return policies.filter((policy) => {
      const matchesSearch =
        !term ||
        [
          resolvePolicyTitle(policy, regulationMap),
          resolveRegulationName(policy, regulationMap),
          resolveSubjectType(policy),
          String(resolveInternalMin(policy)),
          String(resolveExternalMin(policy)),
          String(resolveTotalMin(policy)),
          String(resolveInternalMax(policy)),
          String(resolveExternalMax(policy)),
          String(resolveTotalMax(policy)),
          String(resolveGradeRuleCount(policy)),
          policy?.gpaFormulaType,
          policy?.cgpaFormulaType
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesRegulation =
        !regulationFilter || resolveRegulationId(policy) === String(regulationFilter);

      const matchesSubjectType =
        !subjectTypeFilter ||
        String(resolveSubjectType(policy)).toUpperCase() ===
          String(subjectTypeFilter).toUpperCase();

      return matchesSearch && matchesRegulation && matchesSubjectType;
    });
  }, [policies, search, regulationFilter, subjectTypeFilter, regulationMap]);

  const openCreateModal = () => {
    setEditingPolicy(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (policy) => {
    setEditingPolicy(policy);
    setForm({
      regulationId: resolveRegulationId(policy),
      subjectType: resolveSubjectType(policy) === "-" ? "THEORY" : resolveSubjectType(policy),
      internalMax: String(resolveInternalMax(policy)),
      externalMax: String(resolveExternalMax(policy)),
      totalMax: String(resolveTotalMax(policy)),
      internalMin: String(resolveInternalMin(policy)),
      externalMin: String(resolveExternalMin(policy)),
      totalMin: String(resolveTotalMin(policy)),
      gpaFormulaType: policy?.gpaFormulaType || "CBCS",
      cgpaFormulaType: policy?.cgpaFormulaType || "CBCS",
      status: policy?.isActive ? "ACTIVE" : "INACTIVE"
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingPolicy(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "internalMax" || name === "externalMax") {
        const internal = Number(name === "internalMax" ? value || 0 : next.internalMax || 0);
        const external = Number(name === "externalMax" ? value || 0 : next.externalMax || 0);
        next.totalMax = String(internal + external);
      }

      return next;
    });
  };

  const validateForm = () => {
    if (!form.regulationId) return "Regulation is required";
    if (!form.subjectType.trim()) return "Subject type is required";

    const internalMax = Number(form.internalMax || 0);
    const externalMax = Number(form.externalMax || 0);
    const totalMax = Number(form.totalMax || 0);
    const internalMin = Number(form.internalMin || 0);
    const externalMin = Number(form.externalMin || 0);
    const totalMin = Number(form.totalMin || 0);

    if (
      [internalMax, externalMax, totalMax, internalMin, externalMin, totalMin].some(
        (value) => Number.isNaN(value) || value < 0
      )
    ) {
      return "All marks fields must be valid non-negative numbers";
    }

    if (internalMax + externalMax !== totalMax) {
      return "Total Max must equal Internal Max + External Max";
    }

    if (internalMin > internalMax) {
      return "Internal Min cannot be greater than Internal Max";
    }

    if (externalMin > externalMax) {
      return "External Min cannot be greater than External Max";
    }

    if (totalMin > totalMax) {
      return "Total Min cannot be greater than Total Max";
    }

    return "";
  };

  const buildPayload = () => ({
    regulationId: form.regulationId,
    subjectType: form.subjectType.trim().toUpperCase(),
    internalMax: Number(form.internalMax || 0),
    externalMax: Number(form.externalMax || 0),
    totalMax: Number(form.totalMax || 0),
    internalMin: Number(form.internalMin || 0),
    externalMin: Number(form.externalMin || 0),
    totalMin: Number(form.totalMin || 0),
    gpaFormulaType: form.gpaFormulaType,
    cgpaFormulaType: form.cgpaFormulaType,
    isActive: form.status === "ACTIVE"
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

      if (editingPolicy?._id) {
        await updateGradingPolicyApi(editingPolicy._id, payload);
      } else {
        await createGradingPolicyApi(payload);
      }

      await loadData();
      closeModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save grading policy");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grading Policies"
        subtitle="Manage pass criteria and grading rules by regulation and subject type"
        action={
          <button
            onClick={openCreateModal}
            className="rounded-2xl bg-[#7C9CCF] px-4 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF]"
          >
            Add Policy
          </button>
        }
      />

      <SectionCard
        title="Policy Directory"
        subtitle="Create, review, and update grading policy rules"
        action={
          <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
            <select
              value={regulationFilter}
              onChange={(event) => setRegulationFilter(event.target.value)}
              className="rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#243447] outline-none focus:border-[#5F7FAF]"
            >
              <option value="">All Regulations</option>
              {regulations.map((regulation) => (
                <option key={regulation._id} value={regulation._id}>
                  {regulation.name ||
                    regulation.regulationName ||
                    regulation.code ||
                    regulation.regulationCode}
                </option>
              ))}
            </select>

            <select
              value={subjectTypeFilter}
              onChange={(event) => setSubjectTypeFilter(event.target.value)}
              className="rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#243447] outline-none focus:border-[#5F7FAF]"
            >
              <option value="">All Subject Types</option>
              {SUBJECT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search grading policies..."
              className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF] xl:w-72"
            />
          </div>
        }
      >
        {loading ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            Loading grading policies...
          </div>
        ) : pageError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {pageError}
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            No grading policies found.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="min-w-full text-sm">
                <thead className="bg-[#EDF3FA] text-[#243447]">
                  <tr>
                    <th className="px-4 py-3 text-left">Policy</th>
                    <th className="px-4 py-3 text-left">Regulation</th>
                    <th className="px-4 py-3 text-left">Subject Type</th>
                    <th className="px-4 py-3 text-left">Internal Min</th>
                    <th className="px-4 py-3 text-left">External Min</th>
                    <th className="px-4 py-3 text-left">Total Min</th>
                    <th className="px-4 py-3 text-left">Max Marks</th>
                    <th className="px-4 py-3 text-left">Grade Rules</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPolicies.map((policy) => (
                    <tr key={policy._id} className="border-t border-[#E6ECF2]">
                      <td className="px-4 py-4 font-medium text-[#243447]">
                        {resolvePolicyTitle(policy, regulationMap)}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveRegulationName(policy, regulationMap)}
                      </td>
                      <td className="px-4 py-4">
                        <TypeBadge value={resolveSubjectType(policy)} />
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveInternalMin(policy)}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveExternalMin(policy)}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveTotalMin(policy)}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveInternalMax(policy)} / {resolveExternalMax(policy)} / {resolveTotalMax(policy)}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveGradeRuleCount(policy)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={policy.status} isActive={policy.isActive} />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => openEditModal(policy)}
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

            <div className="grid gap-4 xl:hidden">
              {filteredPolicies.map((policy) => (
                <div
                  key={policy._id}
                  className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-base font-semibold text-[#243447]">
                        {resolvePolicyTitle(policy, regulationMap)}
                      </h4>
                      <p className="mt-1 text-sm text-[#6B7A8C]">
                        {resolveRegulationName(policy, regulationMap)}
                      </p>
                    </div>

                    <StatusBadge status={policy.status} isActive={policy.isActive} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <TypeBadge value={resolveSubjectType(policy)} />
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-[#243447]">
                    <p>
                      <span className="font-medium">Internal Min:</span>{" "}
                      {resolveInternalMin(policy)}
                    </p>
                    <p>
                      <span className="font-medium">External Min:</span>{" "}
                      {resolveExternalMin(policy)}
                    </p>
                    <p>
                      <span className="font-medium">Total Min:</span>{" "}
                      {resolveTotalMin(policy)}
                    </p>
                    <p>
                      <span className="font-medium">Max Marks:</span>{" "}
                      {resolveInternalMax(policy)} / {resolveExternalMax(policy)} / {resolveTotalMax(policy)}
                    </p>
                    <p>
                      <span className="font-medium">Grade Rules:</span>{" "}
                      {resolveGradeRuleCount(policy)}
                    </p>
                  </div>

                  <button
                    onClick={() => openEditModal(policy)}
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
        title={editingPolicy ? "Edit Grading Policy" : "Add Grading Policy"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Regulation
              </label>
              <select
                name="regulationId"
                value={form.regulationId}
                onChange={handleFormChange}
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none focus:border-[#5F7FAF]"
              >
                <option value="">Select Regulation</option>
                {regulations.map((regulation) => (
                  <option key={regulation._id} value={regulation._id}>
                    {regulation.name ||
                      regulation.regulationName ||
                      regulation.code ||
                      regulation.regulationCode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Subject Type
              </label>
              <select
                name="subjectType"
                value={form.subjectType}
                onChange={handleFormChange}
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none focus:border-[#5F7FAF]"
              >
                {SUBJECT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Internal Max
              </label>
              <input
                type="number"
                name="internalMax"
                value={form.internalMax}
                onChange={handleFormChange}
                placeholder="40"
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                External Max
              </label>
              <input
                type="number"
                name="externalMax"
                value={form.externalMax}
                onChange={handleFormChange}
                placeholder="60"
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Total Max
              </label>
              <input
                type="number"
                name="totalMax"
                value={form.totalMax}
                onChange={handleFormChange}
                placeholder="100"
                className="w-full rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-[#243447] outline-none"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Internal Min
              </label>
              <input
                type="number"
                name="internalMin"
                value={form.internalMin}
                onChange={handleFormChange}
                placeholder="23"
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                External Min
              </label>
              <input
                type="number"
                name="externalMin"
                value={form.externalMin}
                onChange={handleFormChange}
                placeholder="27"
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Total Min
              </label>
              <input
                type="number"
                name="totalMin"
                value={form.totalMin}
                onChange={handleFormChange}
                placeholder="50"
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                GPA Formula Type
              </label>
              <select
                name="gpaFormulaType"
                value={form.gpaFormulaType}
                onChange={handleFormChange}
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none focus:border-[#5F7FAF]"
              >
                {FORMULA_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                CGPA Formula Type
              </label>
              <select
                name="cgpaFormulaType"
                value={form.cgpaFormulaType}
                onChange={handleFormChange}
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none focus:border-[#5F7FAF]"
              >
                {FORMULA_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
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
                : editingPolicy
                  ? "Update Policy"
                  : "Create Policy"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}