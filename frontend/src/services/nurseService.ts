import { api } from "./authService";

export async function saveVital(data: any) {
  const response = await api.post(
    "/api/vitals/",
    data
  );

  return response.data;
}

export async function getPatientVitals(
  patientId: string
) {
  const response = await api.get(
    `/api/vitals/patient/${patientId}`
  );

  return response.data;
}