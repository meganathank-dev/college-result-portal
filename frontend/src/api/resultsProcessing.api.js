import { api } from "./axios";

export const processSingleResultApi = async (payload) => {
  const response = await api.post("/results/process-single", payload);
  return response.data;
};

export const processExamSessionResultsApi = async (payload) => {
  const response = await api.post("/results/process-exam-session", payload);
  return response.data;
};

export const getProcessedResultsApi = async () => {
  const response = await api.get("/results/processed-results");
  return response.data;
};

export const getSemesterSummariesApi = async () => {
  const response = await api.get("/results/semester-summaries");
  return response.data;
};