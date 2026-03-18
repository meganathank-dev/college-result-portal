import { api } from "./axios";

export const getMarkEntriesApi = async () => {
  const response = await api.get("/mark-entries");
  return response.data;
};

export const getMarkEntryByIdApi = async (markEntryId) => {
  const response = await api.get(`/mark-entries/${markEntryId}`);
  return response.data;
};

export const createMarkEntryApi = async (payload) => {
  const response = await api.post("/mark-entries", payload);
  return response.data;
};

export const updateMarkEntryApi = async (markEntryId, payload) => {
  const response = await api.put(`/mark-entries/${markEntryId}`, payload);
  return response.data;
};

export const verifyMarkEntryApi = async (markEntryId) => {
  const response = await api.patch(`/mark-entries/${markEntryId}/verify`);
  return response.data;
};

export const lockMarkEntryApi = async (markEntryId) => {
  const response = await api.patch(`/mark-entries/${markEntryId}/lock`);
  return response.data;
};