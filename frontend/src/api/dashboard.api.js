import { api } from "./axios";

export const getDashboardStatsApi = async () => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};