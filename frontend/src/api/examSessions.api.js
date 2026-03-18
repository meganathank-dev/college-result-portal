import { api } from "./axios";

export const getExamSessionsApi = async () => {
  const response = await api.get("/exam-sessions");
  return response.data;
};

export const getExamSessionByIdApi = async (examSessionId) => {
  const response = await api.get(`/exam-sessions/${examSessionId}`);
  return response.data;
};

export const createExamSessionApi = async (payload) => {
  const response = await api.post("/exam-sessions", payload);
  return response.data;
};

export const updateExamSessionApi = async (examSessionId, payload) => {
  const response = await api.put(`/exam-sessions/${examSessionId}`, payload);
  return response.data;
};

export const toggleExamSessionStatusApi = async (examSessionId) => {
  const response = await api.patch(`/exam-sessions/${examSessionId}/toggle-status`);
  return response.data;
};