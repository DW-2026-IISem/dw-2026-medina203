export interface UpdateResourceDto {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description?: string | null;
}