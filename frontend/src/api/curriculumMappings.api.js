import { api } from "./axios";

export const getCurriculumMappingsApi = async () => {
  const response = await api.get("/curriculum-mappings");
  return response.data;
};

export const createCurriculumMappingApi = async (payload) => {
  const response = await api.post("/curriculum-mappings", payload);
  return response.data;
};

export const updateCurriculumMappingApi = async (mappingId, payload) => {
  const response = await api.put(`/curriculum-mappings/${mappingId}`, payload);
  return response.data;
};