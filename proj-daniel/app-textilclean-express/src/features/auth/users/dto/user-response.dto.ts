import { User, UserI } from "../user.model";

export type UserResponseDto = Omit<UserI, "password">;

export function toUserResponse(user: User): UserResponseDto {
  const { password: _password, ...safe } = user.toJSON() as UserI & { password?: string };
  return safe;
}