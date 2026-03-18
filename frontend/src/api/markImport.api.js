import { api } from "./axios";

export const getMarkImportSubjectsApi = async (params) => {
  const response = await api.get("/mark-entries/import-subjects", { params });
  return response.data;
};

export const getMarkImportCandidatesApi = async (params) => {
  const response = await api.get("/mark-entries/import-candidates", { params });
  return response.data;
};

export const importMarkEntriesApi = async (payload) => {
  const response = await api.post("/mark-entries/import", payload);
  return response.data;
};