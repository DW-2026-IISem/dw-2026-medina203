export interface CreateRoleDto {
  name: string;
  description?: string | null;
  status?: "active" | "inactive";
}