export type Role = "SUPER_ADMIN" | "EXECUTIVE" | "CLIENT";
export type DocumentStatus = "PENDING" | "UPLOADED" | "APPROVED" | "REJECTED";

export interface UserSession {
  userId: string;
  role: Role;
  rut: string;
}

export interface ApiError {
  error: string;
}
