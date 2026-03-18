import { api } from "./axios";

export const getSemestersApi = async () => {
  const response = await api.get("/semesters");
  return response.data;
};

export const createSemesterApi = async (payload) => {
  const response = await api.post("/semesters", payload);
  return response.data;
};

export const updateSemesterApi = async (semesterId, payload) => {
  const response = await api.put(`/semesters/${semesterId}`, payload);
  return response.data;
};