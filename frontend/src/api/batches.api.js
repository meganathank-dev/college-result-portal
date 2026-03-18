import { api } from "./axios";

export const getBatchesApi = async () => {
  const response = await api.get("/batches");
  return response.data;
};

export const createBatchApi = async (payload) => {
  const response = await api.post("/batches", payload);
  return response.data;
};

export const updateBatchApi = async (batchId, payload) => {
  const response = await api.put(`/batches/${batchId}`, payload);
  return response.data;
};