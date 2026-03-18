import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import Modal from "../../components/common/Modal";
import {
  getDepartmentsApi,
  createDepartmentApi,
  updateDepartmentApi
} from "../../api/departments.api";

const emptyForm = {
  code: "",
  name: "",
  shortName: "",
  status: "ACTIVE"
};

function DepartmentStatusBadge({ status }) {
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

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setPageError("");
      const response = await getDepartmentsApi();
      setDepartments(response?.data || []);
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const filteredDepartments = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return departments;

    return departments.filter((dept) =>
      [dept.code, dept.name, dept.shortName, dept.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [departments, search]);

  const openCreateModal = () => {
    setEditingDepartment(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (department) => {
    setEditingDepartment(department);
    setForm({
      code: department.code || "",
      name: department.name || "",
      shortName: department.shortName || "",
      status: String(department.status || "ACTIVE").toUpperCase()
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingDepartment(null);
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
    if (!form.code.trim()) return "Department code is required";
    if (!form.name.trim()) return "Department name is required";
    if (!form.shortName.trim()) return "Short name is required";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      shortName: form.shortName.trim(),
      status: form.status
    };

    try {
      setSaving(true);
      setFormError("");

      if (editingDepartment?._id) {
        await updateDepartmentApi(editingDepartment._id, payload);
      } else {
        await createDepartmentApi(payload);
      }

      await loadDepartments();
      closeModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        subtitle="Manage department master data for the college"
        action={
          <button
            onClick={openCreateModal}
            className="rounded-2xl bg-[#7C9CCF] px-4 py-3 text-sm font-medium text-white hover:bg-[#5F7FAF]"
          >
            Add Department
          </button>
        }
      />

      <SectionCard
        title="Department Directory"
        subtitle="Create, review, and update department records"
        action={
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search departments..."
            className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-sm text-[#243447] outline-none placeholder:text-[#A3AFBF] focus:border-[#5F7FAF] sm:w-72"
          />
        }
      >
        {loading ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            Loading departments...
          </div>
        ) : pageError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {pageError}
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm text-[#6B7A8C]">
            No departments found.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-sm">
                <thead className="bg-[#EDF3FA] text-[#243447]">
                  <tr>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Department Name</th>
                    <th className="px-4 py-3 text-left">Short Name</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((department) => (
                    <tr key={department._id} className="border-t border-[#E6ECF2]">
                      <td className="px-4 py-4 font-medium text-[#243447]">{department.code}</td>
                      <td className="px-4 py-4 text-[#243447]">{department.name}</td>
                      <td className="px-4 py-4 text-[#243447]">{department.shortName || "-"}</td>
                      <td className="px-4 py-4">
                        <DepartmentStatusBadge status={department.status} />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => openEditModal(department)}
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
              {filteredDepartments.map((department) => (
                <div
                  key={department._id}
                  className="rounded-2xl border border-[#E6ECF2] bg-[#FBFCFE] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-base font-semibold text-[#243447]">
                        {department.name}
                      </h4>
                      <p className="mt-1 text-sm text-[#6B7A8C]">
                        {department.code} • {department.shortName || "-"}
                      </p>
                    </div>

                    <DepartmentStatusBadge status={department.status} />
                  </div>

                  <button
                    onClick={() => openEditModal(department)}
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
        title={editingDepartment ? "Edit Department" : "Add Department"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#243447]">
                Department Code
              </label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleFormChange}
                placeholder="CSE"
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
              Department Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              placeholder="Computer Science and Engineering"
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
                : editingDepartment
                ? "Update Department"
                : "Create Department"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}