import { apiRequest } from "./queryClient";

export interface LoginCredentials {
  email: string;
  phone: string;
}

export interface VerifyOtpCredentials {
  email: string;
  phone: string;
  otp: string;
}

export async function sendOtp(credentials: LoginCredentials) {
  const response = await apiRequest("POST", "/api/auth/send-otp", credentials);
  return response.json();
}

export async function verifyOtp(credentials: VerifyOtpCredentials) {
  const response = await apiRequest("POST", "/api/auth/verify-otp", credentials);
  return response.json();
}

export async function logout() {
  const response = await apiRequest("POST", "/api/auth/logout");
  return response.json();
}

export async function getCurrentUser() {
  const response = await apiRequest("GET", "/api/auth/me");
  return response.json();
}
