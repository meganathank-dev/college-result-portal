import { api } from "./axios";

export const getGradingPoliciesApi = async () => {
  const response = await api.get("/grading-policies");
  return response.data;
};

export const createGradingPolicyApi = async (payload) => {
  const response = await api.post("/grading-policies", payload);
  return response.data;
};

export const updateGradingPolicyApi = async (policyId, payload) => {
  const response = await api.put(`/grading-policies/${policyId}`, payload);
  return response.data;
};