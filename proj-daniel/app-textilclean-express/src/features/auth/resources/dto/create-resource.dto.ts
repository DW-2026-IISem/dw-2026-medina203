export interface CreateResourceDto {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description?: string | null;
  status?: "active" | "inactive";
}