import { api } from "./axios";

export const getExamRegistrationsApi = async () => {
  const response = await api.get("/exam-registrations");
  return response.data;
};

export const getExamRegistrationByIdApi = async (examRegistrationId) => {
  const response = await api.get(`/exam-registrations/${examRegistrationId}`);
  return response.data;
};

export const createExamRegistrationApi = async (payload) => {
  const response = await api.post("/exam-registrations", payload);
  return response.data;
};

export const autoSyncCurrentExamRegistrationsApi = async (payload) => {
  const response = await api.post("/exam-registrations/auto-sync-current", payload);
  return response.data;
};

export const getArrearCandidatesApi = async (params) => {
  const response = await api.get("/exam-registrations/arrear-candidates", { params });
  return response.data;
};

export const registerArrearCandidatesApi = async (payload) => {
  const response = await api.post("/exam-registrations/register-arrears", payload);
  return response.data;
};

export const updateExamRegistrationApi = async (examRegistrationId, payload) => {
  const response = await api.put(`/exam-registrations/${examRegistrationId}`, payload);
  return response.data;
};

export const toggleExamRegistrationEligibilityApi = async (examRegistrationId) => {
  const response = await api.patch(
    `/exam-registrations/${examRegistrationId}/toggle-eligibility`
  );
  return response.data;
};