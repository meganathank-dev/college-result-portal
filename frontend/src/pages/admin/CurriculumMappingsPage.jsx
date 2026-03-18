import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import Modal from "../../components/common/Modal";
import { getBatchesApi } from "../../api/batches.api";
import { getProgramsApi } from "../../api/programs.api";
import { getRegulationsApi } from "../../api/regulations.api";
import { getSemestersApi } from "../../api/semesters.api";
import { getSubjectsApi } from "../../api/subjects.api";
import {
  getCurriculumMappingsApi,
  createCurriculumMappingApi,
  updateCurriculumMappingApi
} from "../../api/curriculumMappings.api";

const emptyForm = {
  batchId: "",
  programId: "",
  regulationId: "",
  semesterId: "",
  subjectId: "",
  status: "ACTIVE"
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
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles}`}
    >
      {resolvedActive ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}

const resolveBatchId = (item) =>
  String(item.batchId?._id || item.batchId || item.batch || "");

const resolveBatchLabel = (item, batchMap) => {
  if (item.batchId?.label) return item.batchId.label;
  if (item.batchId?.batchLabel) return item.batchId.batchLabel;
  const batch = batchMap.get(resolveBatchId(item));
  return batch?.label || batch?.batchLabel || "-";
};

const resolveProgramId = (item) =>
  String(item.programId?._id || item.programId || item.program || "");

const resolveProgramName = (item, programMap) => {
  if (item.programId?.name) return item.programId.name;
  const program = programMap.get(resolveProgramId(item));
  return program?.name || "-";
};

const resolveRegulationId = (item) =>
  String(item.regulationId?._id || item.regulationId || item.regulation || "");

const resolveRegulationName = (item, regulationMap) => {
  if (item.regulationId?.name) return item.regulationId.name;
  if (item.regulationId?.regulationName) return item.regulationId.regulationName;
  const regulation = regulationMap.get(resolveRegulationId(item));
  return (
    regulation?.name ||
    regulation?.regulationName ||
    regulation?.code ||
    regulation?.regulationCode ||
    "-"
  );
};

const resolveSemesterId = (item) =>
  String(item.semesterId?._id || item.semesterId || item.semester || "");

const resolveSemesterLabel = (item, semesterMap) => {
  if (item.semesterId?.label) return item.semesterId.label;
  if (item.semesterId?.semesterLabel) return item.semesterId.semesterLabel;
  const semester = semesterMap.get(resolveSemesterId(item));
  return semester?.label || semester?.semesterLabel || "-";
};

const resolveSubjectId = (item) =>
  String(item.subjectId?._id || item.subjectId || item.subject || "");

const resolveSubjectCode = (item, subjectMap) => {
  if (item.subjectId?.code) return item.subjectId.code;
  const subject = subjectMap.get(resolveSubjectId(item));
  return subject?.code || "-";
};

const resolveSubjectName = (item, subjectMap) => {
  if (item.subjectId?.name) return item.subjectId.name;
  const subject = subjectMap.get(resolveSubjectId(item));
  return subject?.name || "-";
};

export default function CurriculumMappingsPage() {
  const [mappings, setMappings] = useState([]);
  const [batches, setBatches] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [regulationFilter, setRegulationFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError("");

      const [
        mappingResponse,
        batchResponse,
        programResponse,
        regulationResponse,
        semesterResponse,
        subjectResponse
      ] = await Promise.all([
        getCurriculumMappingsApi(),
        getBatchesApi(),
        getProgramsApi(),
        getRegulationsApi(),
        getSemestersApi(),
        getSubjectsApi()
      ]);

      setMappings(mappingResponse?.data || []);
      setBatches(batchResponse?.data || []);
      setPrograms(programResponse?.data || []);
      setRegulations(regulationResponse?.data || []);
      setSemesters(semesterResponse?.data || []);
      setSubjects(subjectResponse?.data || []);
    } catch (err) {
      setPageError(
        err?.response?.data?.message || "Failed to load curriculum mappings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const batchMap = useMemo(() => {
    const map = new Map();
    batches.forEach((item) => map.set(String(item._id), item));
    return map;
  }, [batches]);

  const programMap = useMemo(() => {
    const map = new Map();
    programs.forEach((item) => map.set(String(item._id), item));
    return map;
  }, [programs]);

  const regulationMap = useMemo(() => {
    const map = new Map();
    regulations.forEach((item) => map.set(String(item._id), item));
    return map;
  }, [regulations]);

  const semesterMap = useMemo(() => {
    const map = new Map();
    semesters.forEach((item) => map.set(String(item._id), item));
    return map;
  }, [semesters]);

  const subjectMap = useMemo(() => {
    const map = new Map();
    subjects.forEach((item) => map.set(String(item._id), item));
    return map;
  }, [subjects]);

  const filteredMappings = useMemo(() => {
    const term = search.trim().toLowerCase();

    return mappings.filter((item) => {
      const matchesSearch =
        !term ||
        [
          resolveBatchLabel(item, batchMap),
          resolveProgramName(item, programMap),
          resolveRegulationName(item, regulationMap),
          resolveSemesterLabel(item, semesterMap),
          resolveSubjectCode(item, subjectMap),
          resolveSubjectName(item, subjectMap)
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesBatch =
        !batchFilter || resolveBatchId(item) === String(batchFilter);

      const matchesProgram =
        !programFilter || resolveProgramId(item) === String(programFilter);

      const matchesRegulation =
        !regulationFilter || resolveRegulationId(item) === String(regulationFilter);

      const matchesSemester =
        !semesterFilter || resolveSemesterId(item) === String(semesterFilter);

      return (
        matchesSearch &&
        matchesBatch &&
        matchesProgram &&
        matchesRegulation &&
        matchesSemester
      );
    });
  }, [
    mappings,
    search,
    batchFilter,
    programFilter,
    regulationFilter,
    semesterFilter,
    batchMap,
    programMap,
    regulationMap,
    semesterMap,
    subjectMap
  ]);

  const openCreateModal = () => {
    setEditingMapping(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingMapping(item);
    setForm({
      batchId: resolveBatchId(item),
      programId: resolveProgramId(item),
      regulationId: resolveRegulationId(item),
      semesterId: resolveSemesterId(item),
      subjectId: resolveSubjectId(item),
      status: item?.isActive ? "ACTIVE" : "INACTIVE"
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingMapping(null);
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
    if (!form.batchId) return "Batch is required";
    if (!form.programId) return "Program is required";
    if (!form.regulationId) return "Regulation is required";
    if (!form.semesterId) return "Semester is required";
    if (!form.subjectId) return "Subject is required";
    return "";
  };

  const buildPayload = () => ({
    batchId: form.batchId,
    programId: form.programId,
    regulationId: form.regulationId,
    semesterId: form.semesterId,
    subjectId: form.subjectId,
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

      if (editingMapping?._id) {
        await updateCurriculumMappingApi(editingMapping._id, payload);
      } else {
        await createCurriculumMappingApi(payload);
      }

      await loadData();
      closeModal();
    } catch (err) {
      setFormError(
        err?.response?.data?.message || "Failed to save curriculum mapping"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Curriculum Mappings"
        subtitle="Map generic subjects to batch, program, regulation, and semester"
        action={
          <button
            onClick={openCreateModal}
            className="rounded-2xl bg-[#7C9CCF] px-4 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF]"
          >
            Add Mapping
          </button>
        }
      />

      <SectionCard
        title="Curriculum Directory"
        subtitle="Manage subject mappings"
        action={
          <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
            <select
              value={batchFilter}
              onChange={(event) => setBatchFilter(event.target.value)}
              className="rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#243447] outline-none focus:border-[#5F7FAF]"
            >
              <option value="">All Batches</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.label || batch.batchLabel}
                </option>
              ))}
            </select>

            <select
              value={programFilter}
              onChange={(event) => setProgramFilter(event.target.value)}
              className="rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#243447] outline-none focus:border-[#5F7FAF]"
            >
              <option value="">All Programs</option>
              {programs.map((program) => (
                <option key={program._id} value={program._id}>
                  {program.name}
                </option>
              ))}
            </select>

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
              value={semesterFilter}
              onChange={(event) => setSemesterFilter(event.target.value)}
              className="rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#243447] outline-none focus:border-[#5F7FAF]"
            >
              <option value="">All Semesters</option>
              {semesters.map((semester) => (
                <option key={semester._id} value={semester._id}>
                  {semester.label ||
                    semester.semesterLabel ||
                    `Semester ${semester.number || semester.semesterNumber}`}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search mappings..."
              className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF] xl:w-72"
            />
          </div>
        }
      >
        {loading ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            Loading curriculum mappings...
          </div>
        ) : pageError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {pageError}
          </div>
        ) : filteredMappings.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            No curriculum mappings found.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="min-w-full text-sm">
                <thead className="bg-[#EDF3FA] text-[#243447]">
                  <tr>
                    <th className="px-4 py-3 text-left">Batch</th>
                    <th className="px-4 py-3 text-left">Program</th>
                    <th className="px-4 py-3 text-left">Regulation</th>
                    <th className="px-4 py-3 text-left">Semester</th>
                    <th className="px-4 py-3 text-left">Subject Code</th>
                    <th className="px-4 py-3 text-left">Subject Name</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMappings.map((item) => (
                    <tr key={item._id} className="border-t border-[#E6ECF2]">
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveBatchLabel(item, batchMap)}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveProgramName(item, programMap)}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveRegulationName(item, regulationMap)}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveSemesterLabel(item, semesterMap)}
                      </td>
                      <td className="px-4 py-4 font-medium text-[#243447]">
                        {resolveSubjectCode(item, subjectMap)}
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveSubjectName(item, subjectMap)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={item.status} isActive={item.isActive} />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => openEditModal(item)}
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
              {filteredMappings.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-base font-semibold text-[#243447]">
                        {resolveSubjectCode(item, subjectMap)} - {resolveSubjectName(item, subjectMap)}
                      </h4>
                      <p className="mt-1 text-sm text-[#6B7A8C]">
                        {resolveProgramName(item, programMap)}
                      </p>
                    </div>

                    <StatusBadge status={item.status} isActive={item.isActive} />
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-[#243447]">
                    <p>
                      <span className="font-medium">Batch:</span>{" "}
                      {resolveBatchLabel(item, batchMap)}
                    </p>
                    <p>
                      <span className="font-medium">Regulation:</span>{" "}
                      {resolveRegulationName(item, regulationMap)}
                    </p>
                    <p>
                      <span className="font-medium">Semester:</span>{" "}
                      {resolveSemesterLabel(item, semesterMap)}
                    </p>
                  </div>

                  <button
                    onClick={() => openEditModal(item)}
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
        title={editingMapping ? "Edit Curriculum Mapping" : "Add Curriculum Mapping"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Batch
              </label>
              <select
                name="batchId"
                value={form.batchId}
                onChange={handleFormChange}
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none focus:border-[#5F7FAF]"
              >
                <option value="">Select Batch</option>
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.label || batch.batchLabel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Program
              </label>
              <select
                name="programId"
                value={form.programId}
                onChange={handleFormChange}
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none focus:border-[#5F7FAF]"
              >
                <option value="">Select Program</option>
                {programs.map((program) => (
                  <option key={program._id} value={program._id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                Semester
              </label>
              <select
                name="semesterId"
                value={form.semesterId}
                onChange={handleFormChange}
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none focus:border-[#5F7FAF]"
              >
                <option value="">Select Semester</option>
                {semesters.map((semester) => (
                  <option key={semester._id} value={semester._id}>
                    {semester.label ||
                      semester.semesterLabel ||
                      `Semester ${semester.number || semester.semesterNumber}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#243447]">
              Subject
            </label>
            <select
              name="subjectId"
              value={form.subjectId}
              onChange={handleFormChange}
              className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none focus:border-[#5F7FAF]"
            >
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
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
                : editingMapping
                  ? "Update Mapping"
                  : "Create Mapping"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}