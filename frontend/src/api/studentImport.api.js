import { api } from "./axios";

export const downloadStudentImportTemplateApi = async () => {
  const response = await api.get("/students/import/template", {
    responseType: "blob"
  });
  return response;
};

export const importStudentsApi = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/students/import", formData);
  return response.data;
};