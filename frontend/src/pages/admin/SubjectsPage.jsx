import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import Modal from "../../components/common/Modal";
import {
  getSubjectsApi,
  createSubjectApi,
  updateSubjectApi
} from "../../api/subjects.api";

const SUBJECT_TYPES = [
  "THEORY",
  "LAB",
  "THEORY_CUM_LAB",
  "PROJECT",
  "PRACTICAL",
  "ELECTIVE",
  "OPEN_ELECTIVE",
  "PROFESSIONAL_ELECTIVE",
  "MANDATORY",
  "NON_CGPA"
];

const emptyForm = {
  code: "",
  name: "",
  shortName: "",
  subjectType: "THEORY",
  credits: "",
  internalMax: "",
  externalMax: "",
  totalMax: "",
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

function TypeBadge({ value }) {
  return (
    <span className="inline-flex rounded-full border border-[#DCE7F7] bg-[#EDF3FA] px-3 py-1 text-xs font-medium text-[#4A6A94]">
      {value || "-"}
    </span>
  );
}

const resolveSubjectType = (subject) =>
  subject.subjectType || subject.type || subject.subjectCategory || "-";

const resolveShortName = (subject) =>
  subject.shortName ??
  subject.shortname ??
  subject.short_name ??
  subject.abbreviation ??
  "-";

const resolveCredits = (subject) => subject.credits ?? subject.credit ?? "-";
const resolveInternalMax = (subject) => subject.internalMax ?? subject.internalMarks ?? 0;
const resolveExternalMax = (subject) => subject.externalMax ?? subject.externalMarks ?? 0;
const resolveTotalMax = (subject) => subject.totalMax ?? subject.totalMarks ?? 0;

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setPageError("");
      const response = await getSubjectsApi();
      setSubjects(response?.data || []);
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const filteredSubjects = useMemo(() => {
    const term = search.trim().toLowerCase();

    return subjects.filter((subject) => {
      const matchesSearch =
        !term ||
        [
          subject.code,
          subject.name,
          resolveShortName(subject),
          resolveSubjectType(subject),
          String(resolveCredits(subject)),
          String(resolveInternalMax(subject)),
          String(resolveExternalMax(subject)),
          String(resolveTotalMax(subject))
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesType =
        !typeFilter || String(resolveSubjectType(subject)).toUpperCase() === String(typeFilter).toUpperCase();

      return matchesSearch && matchesType;
    });
  }, [subjects, search, typeFilter]);

  const openCreateModal = () => {
    setEditingSubject(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setForm({
      code: subject.code || "",
      name: subject.name || "",
      shortName: resolveShortName(subject) === "-" ? "" : resolveShortName(subject),
      subjectType: resolveSubjectType(subject) === "-" ? "THEORY" : resolveSubjectType(subject),
      credits: String(resolveCredits(subject) === "-" ? "" : resolveCredits(subject)),
      internalMax: String(resolveInternalMax(subject)),
      externalMax: String(resolveExternalMax(subject)),
      totalMax: String(resolveTotalMax(subject)),
      status: String(subject.status || "ACTIVE").toUpperCase()
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingSubject(null);
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
    if (!form.code.trim()) return "Subject code is required";
    if (!form.name.trim()) return "Subject name is required";
    if (!form.shortName.trim()) return "Short name is required";
    if (!form.subjectType.trim()) return "Subject type is required";
    if (!form.credits) return "Credits are required";

    const credits = Number(form.credits);
    if (Number.isNaN(credits) || credits < 0) {
      return "Credits must be a valid number";
    }

    const internal = Number(form.internalMax || 0);
    const external = Number(form.externalMax || 0);
    const total = Number(form.totalMax || 0);

    if ([internal, external, total].some((value) => Number.isNaN(value) || value < 0)) {
      return "Marks fields must be valid non-negative numbers";
    }

    if (internal + external !== total) {
      return "Total Max must equal Internal Max + External Max";
    }

    return "";
  };

  const buildPayload = () => ({
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    shortName: form.shortName.trim(),
    subjectType: form.subjectType.trim().toUpperCase(),
    credits: Number(form.credits),
    internalMax: Number(form.internalMax || 0),
    externalMax: Number(form.externalMax || 0),
    totalMax: Number(form.totalMax || 0),
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

      if (editingSubject?._id) {
        await updateSubjectApi(editingSubject._id, payload);
      } else {
        await createSubjectApi(payload);
      }

      await loadSubjects();
      closeModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save subject");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        subtitle="Manage generic subject master data. Department, regulation, and semester linkage will be handled in Curriculum Mappings."
        action={
          <button
            onClick={openCreateModal}
            className="rounded-2xl bg-[#7C9CCF] px-4 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF]"
          >
            Add Subject
          </button>
        }
      />

      <SectionCard
        title="Subject Directory"
        subtitle="Create, review, and update generic subject records"
        action={
          <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
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
              placeholder="Search subjects..."
              className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF] xl:w-72"
            />
          </div>
        }
      >
        {loading ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            Loading subjects...
          </div>
        ) : pageError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {pageError}
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            No subjects found.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="min-w-full text-sm">
                <thead className="bg-[#EDF3FA] text-[#243447]">
                  <tr>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Subject Name</th>
                    <th className="px-4 py-3 text-left">Short Name</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Credits</th>
                    <th className="px-4 py-3 text-left">Marks</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((subject) => (
                    <tr key={subject._id} className="border-t border-[#E6ECF2]">
                      <td className="px-4 py-4 font-medium text-[#243447]">{subject.code}</td>
                      <td className="px-4 py-4 text-[#243447]">{subject.name}</td>
                      <td className="px-4 py-4 text-[#243447]">{resolveShortName(subject)}</td>
                      <td className="px-4 py-4">
                        <TypeBadge value={resolveSubjectType(subject)} />
                      </td>
                      <td className="px-4 py-4 text-[#243447]">{resolveCredits(subject)}</td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveInternalMax(subject)} / {resolveExternalMax(subject)} / {resolveTotalMax(subject)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={subject.status} isActive={subject.isActive} />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => openEditModal(subject)}
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
              {filteredSubjects.map((subject) => (
                <div
                  key={subject._id}
                  className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-base font-semibold text-[#243447]">
                        {subject.name}
                      </h4>
                      <p className="mt-1 text-sm text-[#6B7A8C]">
                        {subject.code} • {resolveShortName(subject)}
                      </p>
                    </div>

                    <StatusBadge status={subject.status} isActive={subject.isActive} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <TypeBadge value={resolveSubjectType(subject)} />
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-[#243447]">
                    <p><span className="font-medium">Credits:</span> {resolveCredits(subject)}</p>
                    <p>
                      <span className="font-medium">Marks:</span>{" "}
                      {resolveInternalMax(subject)} / {resolveExternalMax(subject)} / {resolveTotalMax(subject)}
                    </p>
                  </div>

                  <button
                    onClick={() => openEditModal(subject)}
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
        title={editingSubject ? "Edit Subject" : "Add Subject"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Subject Code
              </label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleFormChange}
                placeholder="CS3501"
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Short Name
              </label>
              <input
                type="text"
                name="shortName"
                value={form.shortName}
                onChange={handleFormChange}
                placeholder="CD"
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#243447]">
              Subject Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              placeholder="Compiler Design"
              className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
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

            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Credits
              </label>
              <input
                type="number"
                step="0.5"
                name="credits"
                value={form.credits}
                onChange={handleFormChange}
                placeholder="4"
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
              />
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
                : editingSubject
                  ? "Update Subject"
                  : "Create Subject"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}