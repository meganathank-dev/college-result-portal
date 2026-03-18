import { api } from "./axios";

export const getSubjectsApi = async () => {
  const response = await api.get("/subjects");
  return response.data;
};

export const createSubjectApi = async (payload) => {
  const response = await api.post("/subjects", payload);
  return response.data;
};

export const updateSubjectApi = async (subjectId, payload) => {
  const response = await api.put(`/subjects/${subjectId}`, payload);
  return response.data;
};