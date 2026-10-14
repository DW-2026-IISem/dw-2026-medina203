import { comparePassword } from "../../../shared/auth/password";
import { AppError } from "../../../shared/errors/app-error";
import {
  ChangePasswordDto,
  CreateUserDto,
  PatchUserDto,
  toUserResponse,
  UpdateUserDto,
  UserResponseDto,
} from "./dto";
import { User } from "./user.model";
import { UsersRepository } from "./users.repository";

export class UsersService {
  public constructor(private readonly repository: UsersRepository = new UsersRepository()) {}

  public async getAll(): Promise<UserResponseDto[]> {
    return (await this.repository.findAllActive()).map(toUserResponse);
  }

  public async getOne(id: number): Promise<UserResponseDto> {
    return toUserResponse(await this.findOrFail(id));
  }

  public async create(body: CreateUserDto): Promise<UserResponseDto> {
    this.validateCredentials(body.username, body.email, body.password);
    await this.assertUnique(body.username, body.email);

    const user = await this.repository.create({
      username: body.username.trim().toLowerCase(),
      email: body.email.trim().toLowerCase(),
      password: body.password,
      avatar: body.avatar ?? null,
      status: body.status ?? "active",
    });
    return toUserResponse(user);
  }

  public async updatePut(id: number, body: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findOrFail(id);
    this.validateIdentity(body.username, body.email);
    await this.assertUnique(body.username, body.email, id);

    await this.repository.update(user, {
      username: body.username.trim().toLowerCase(),
      email: body.email.trim().toLowerCase(),
      avatar: body.avatar ?? null,
    });
    return toUserResponse(user);
  }

  public async updatePatch(id: number, body: PatchUserDto): Promise<UserResponseDto> {
    const user = await this.findOrFail(id);
    const username = body.username ?? user.username;
    const email = body.email ?? user.email;
    this.validateIdentity(username, email);
    await this.assertUnique(username, email, id);

    const update: Partial<Pick<User, "username" | "email" | "avatar">> = {};
    if (body.username !== undefined) update.username = username.trim().toLowerCase();
    if (body.email !== undefined) update.email = email.trim().toLowerCase();
    if (body.avatar !== undefined) update.avatar = body.avatar;
    await this.repository.update(user, update);
    return toUserResponse(user);
  }

  public async changePassword(id: number, body: ChangePasswordDto): Promise<void> {
    if (typeof body.current_password !== "string" || typeof body.new_password !== "string" ||
        body.new_password.length < 8) {
      throw new AppError(400, "current_password and new_password (min 8 characters) are required");
    }

    const user = await this.repository.findByIdWithPassword(id);
    if (!user || user.status !== "active") throw new AppError(404, "User not found");
    if (!(await comparePassword(body.current_password, user.password))) {
      throw new AppError(400, "Current password is incorrect");
    }
    await this.repository.update(user, { password: body.new_password });
  }

  public async deletePhysical(id: number): Promise<void> {
    await this.repository.delete(await this.findOrFail(id, false));
  }

  public async deleteLogical(id: number): Promise<UserResponseDto> {
    const user = await this.findOrFail(id);
    await this.repository.update(user, { status: "inactive" });
    return toUserResponse(user);
  }

  private async findOrFail(id: number, onlyActive = true): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user || (onlyActive && user.status !== "active")) throw new AppError(404, "User not found");
    return user;
  }

  private validateCredentials(username: string, email: string, password: string): void {
    this.validateIdentity(username, email);
    if (typeof password !== "string" || password.length < 8) {
      throw new AppError(400, "password must contain at least 8 characters");
    }
  }

  private validateIdentity(username: string, email: string): void {
    if (typeof username !== "string" || username.trim().length < 3 || username.trim().length > 80) {
      throw new AppError(400, "username must contain between 3 and 80 characters");
    }
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new AppError(400, "email must be valid");
    }
  }

  private async assertUnique(username: string, email: string, excludeId?: number): Promise<void> {
    const conflicts = await this.repository.findConflicts(username, email);
    for (const candidate of conflicts) {
      if (candidate.id === excludeId) continue;
      if (candidate.username === username.trim().toLowerCase()) {
        throw new AppError(409, "Username already in use");
      }
      if (candidate.email === email.trim().toLowerCase()) {
        throw new AppError(409, "Email already in use");
      }
    }
  }
}