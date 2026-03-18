import { api } from "./axios";

export const getProgramsApi = async () => {
  const response = await api.get("/programs");
  return response.data;
};

export const createProgramApi = async (payload) => {
  const response = await api.post("/programs", payload);
  return response.data;
};

export const updateProgramApi = async (programId, payload) => {
  const response = await api.put(`/programs/${programId}`, payload);
  return response.data;
};