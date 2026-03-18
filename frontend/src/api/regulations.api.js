import { api } from "./axios";

export const getRegulationsApi = async () => {
  const response = await api.get("/regulations");
  return response.data;
};

export const createRegulationApi = async (payload) => {
  const response = await api.post("/regulations", payload);
  return response.data;
};

export const updateRegulationApi = async (regulationId, payload) => {
  const response = await api.put(`/regulations/${regulationId}`, payload);
  return response.data;
};