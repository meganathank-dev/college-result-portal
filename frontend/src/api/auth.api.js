import { api } from "./axios";

export const loginApi = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

export const getMyProfileApi = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};