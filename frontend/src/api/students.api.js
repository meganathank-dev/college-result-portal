import { api } from "./axios";

export const getStudentsApi = async () => {
  const response = await api.get("/students");
  return response.data;
};

export const createStudentApi = async (payload) => {
  const response = await api.post("/students", payload);
  return response.data;
};

export const updateStudentApi = async (studentId, payload) => {
  const response = await api.put(`/students/${studentId}`, payload);
  return response.data;
};