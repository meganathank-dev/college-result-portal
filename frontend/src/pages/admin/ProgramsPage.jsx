import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import Modal from "../../components/common/Modal";
import { getDepartmentsApi } from "../../api/departments.api";
import {
  getProgramsApi,
  createProgramApi,
  updateProgramApi
} from "../../api/programs.api";

const emptyForm = {
  code: "",
  name: "",
  shortName: "",
  degreeType: "BE",
  departmentId: "",
  status: "ACTIVE"
};

function StatusBadge({ status }) {
  const normalized = String(status || "").toUpperCase();

  const styles =
    normalized === "ACTIVE"
      ? "bg-[#EEF8F1] text-[#3F7D56] border-[#D6EFD9]"
      : "bg-[#FFF4E8] text-[#9A6A2A] border-[#F1DEC2]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles}`}>
      {normalized || "-"}
    </span>
  );
}

function DegreeBadge({ degreeType }) {
  const value = String(degreeType || "").toUpperCase();

  return (
    <span className="inline-flex rounded-full border border-[#DCE7F7] bg-[#EDF3FA] px-3 py-1 text-xs font-medium text-[#4A6A94]">
      {value || "-"}
    </span>
  );
}

const resolveDepartmentId = (program) => {
  return String(program?.departmentId?._id || program?.departmentId || program?.department || "");
};

const resolveDepartmentName = (program, departmentMap) => {
  if (program?.departmentId?.name) return program.departmentId.name;

  const dept = departmentMap.get(resolveDepartmentId(program));
  return dept?.name || "-";
};

const resolveShortName = (program) => {
  return (
    program?.shortName ??
    program?.shortname ??
    program?.short_name ??
    program?.abbreviation ??
    program?.alias ??
    "-"
  );
};

export default function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError("");

      const [programResponse, departmentResponse] = await Promise.all([
        getProgramsApi(),
        getDepartmentsApi()
      ]);

      setPrograms(programResponse?.data || []);
      setDepartments(departmentResponse?.data || []);
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to load programs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const departmentMap = useMemo(() => {
    const map = new Map();
    departments.forEach((dept) => {
      map.set(String(dept._id), dept);
    });
    return map;
  }, [departments]);

  const filteredPrograms = useMemo(() => {
    const term = search.trim().toLowerCase();

    return programs.filter((program) => {
      const matchesSearch =
        !term ||
        [
          program.code,
          program.name,
          resolveShortName(program),
          program.degreeType,
          program.status,
          resolveDepartmentName(program, departmentMap)
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesDepartment =
        !departmentFilter || resolveDepartmentId(program) === String(departmentFilter);

      return matchesSearch && matchesDepartment;
    });
  }, [programs, search, departmentFilter, departmentMap]);

  const openCreateModal = () => {
    setEditingProgram(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (program) => {
    setEditingProgram(program);
    setForm({
      code: program.code || "",
      name: program.name || "",
      shortName: resolveShortName(program) === "-" ? "" : resolveShortName(program),
      degreeType: String(program.degreeType || "BE").toUpperCase(),
      departmentId: resolveDepartmentId(program),
      status: String(program.status || "ACTIVE").toUpperCase()
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingProgram(null);
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
    if (!form.code.trim()) return "Program code is required";
    if (!form.name.trim()) return "Program name is required";
    if (!form.shortName.trim()) return "Short name is required";
    if (!form.degreeType.trim()) return "Degree type is required";
    if (!form.departmentId) return "Department is required";
    return "";
  };

  const buildPayload = () => ({
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    shortName: form.shortName.trim(),
    degreeType: form.degreeType.trim().toUpperCase(),
    departmentId: form.departmentId,
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

      if (editingProgram?._id) {
        await updateProgramApi(editingProgram._id, payload);
      } else {
        await createProgramApi(payload);
      }

      await loadData();
      closeModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save program");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programs"
        subtitle="Manage academic programs and map them to departments"
        action={
          <button
            onClick={openCreateModal}
            className="rounded-2xl bg-[#7C9CCF] px-4 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF]"
          >
            Add Program
          </button>
        }
      />

      <SectionCard
        title="Program Directory"
        subtitle="Create, review, and update academic programs"
        action={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className="rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#243447] outline-none focus:border-[#5F7FAF]"
            >
              <option value="">All Departments</option>
              {departments.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search programs..."
              className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF] sm:w-72"
            />
          </div>
        }
      >
        {loading ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            Loading programs...
          </div>
        ) : pageError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {pageError}
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            No programs found.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-sm">
                <thead className="bg-[#EDF3FA] text-[#243447]">
                  <tr>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Program Name</th>
                    <th className="px-4 py-3 text-left">Short Name</th>
                    <th className="px-4 py-3 text-left">Degree</th>
                    <th className="px-4 py-3 text-left">Department</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrograms.map((program) => (
                    <tr key={program._id} className="border-t border-[#E6ECF2]">
                      <td className="px-4 py-4 font-medium text-[#243447]">{program.code}</td>
                      <td className="px-4 py-4 text-[#243447]">{program.name}</td>
                      <td className="px-4 py-4 text-[#243447]">{resolveShortName(program)}</td>
                      <td className="px-4 py-4">
                        <DegreeBadge degreeType={program.degreeType} />
                      </td>
                      <td className="px-4 py-4 text-[#243447]">
                        {resolveDepartmentName(program, departmentMap)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={program.status} />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => openEditModal(program)}
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
              {filteredPrograms.map((program) => (
                <div
                  key={program._id}
                  className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-base font-semibold text-[#243447]">
                        {program.name}
                      </h4>
                      <p className="mt-1 text-sm text-[#6B7A8C]">
                        {program.code} • {resolveShortName(program)}
                      </p>
                    </div>

                    <StatusBadge status={program.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <DegreeBadge degreeType={program.degreeType} />
                  </div>

                  <p className="mt-4 text-sm text-[#243447]">
                    <span className="font-medium">Department:</span>{" "}
                    {resolveDepartmentName(program, departmentMap)}
                  </p>

                  <button
                    onClick={() => openEditModal(program)}
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
        title={editingProgram ? "Edit Program" : "Add Program"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Program Code
              </label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleFormChange}
                placeholder="BE-CSE"
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
                placeholder="CSE"
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#243447]">
              Program Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              placeholder="B.E Computer Science and Engineering"
              className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF]"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Degree Type
              </label>
              <select
                name="degreeType"
                value={form.degreeType}
                onChange={handleFormChange}
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none focus:border-[#5F7FAF]"
              >
                <option value="BE">BE</option>
                <option value="BTECH">BTECH</option>
                <option value="ME">ME</option>
                <option value="MTECH">MTECH</option>
                <option value="MBA">MBA</option>
                <option value="MCA">MCA</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Department
              </label>
              <select
                name="departmentId"
                value={form.departmentId}
                onChange={handleFormChange}
                className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none focus:border-[#5F7FAF]"
              >
                <option value="">Select Department</option>
                {departments.map((department) => (
                  <option key={department._id} value={department._id}>
                    {department.name}
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
                : editingProgram
                  ? "Update Program"
                  : "Create Program"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}