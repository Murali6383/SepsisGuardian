import axios from "axios";
import type { LoginResponse } from "../types/auth";

export const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  console.log("LOGIN REQUEST:", {
    url: "http://localhost:8000/api/auth/login",
    email,
  });

  const response = await api.post<LoginResponse>(
    "/api/auth/login",
    {
      email,
      password,
    }
  );

  console.log("LOGIN RESPONSE:", response.data);

  return response.data;
}