import { api } from "./axios";

export const getDepartmentsApi = async () => {
  const response = await api.get("/departments");
  return response.data;
};

export const createDepartmentApi = async (payload) => {
  const response = await api.post("/departments", payload);
  return response.data;
};

export const updateDepartmentApi = async (departmentId, payload) => {
  const response = await api.put(`/departments/${departmentId}`, payload);
  return response.data;
};