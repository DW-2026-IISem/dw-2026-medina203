export interface SessionTokensDto {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

export interface ProfileDto {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  status: "active" | "inactive";
}