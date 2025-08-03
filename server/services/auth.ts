// Session-based authentication - JWT not needed
export interface SessionUser {
  userId: string;
  role: string;
  email: string;
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function validateOTP(provided: string, stored: string): boolean {
  return provided === stored;
}
