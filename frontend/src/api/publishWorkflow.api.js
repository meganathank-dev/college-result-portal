import { api } from "./axios";

export const publishExamSessionApi = async (payload) => {
  const response = await api.post("/publish/publish-exam-session", payload);
  return response.data;
};

export const getPublishSnapshotsApi = async () => {
  const response = await api.get("/publish/snapshots");
  return response.data;
};

export const getPublishSnapshotByIdApi = async (publishSnapshotId) => {
  const response = await api.get(`/publish/snapshots/${publishSnapshotId}`);
  return response.data;
};