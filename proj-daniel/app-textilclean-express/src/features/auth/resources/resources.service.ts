import { AppError } from "../../../shared/errors/app-error";
import { normalizePath } from "../../../shared/auth/resource-match";
import { CreateResourceDto, PatchResourceDto, ResourceResponseDto, toResourceResponse, UpdateResourceDto } from "./dto";
import { Resource } from "./resource.model";
import { ResourcesRepository } from "./resources.repository";

export class ResourcesService {
  public constructor(private readonly repository: ResourcesRepository = new ResourcesRepository()) {}

  public async getAll(): Promise<ResourceResponseDto[]> {
    return (await this.repository.findAllActive()).map(toResourceResponse);
  }
  public async getOne(id: number): Promise<ResourceResponseDto> {
    return toResourceResponse(await this.findOrFail(id));
  }
  public async create(body: CreateResourceDto): Promise<ResourceResponseDto> {
    const method = this.validateMethod(body.method);
    const path = this.validatePath(body.path);
    await this.assertOperationAvailable(method, path);
    const resource = await this.repository.create({ method, path, description: body.description ?? null, status: body.status ?? "active" });
    return toResourceResponse(resource);
  }
  public async updatePut(id: number, body: UpdateResourceDto): Promise<ResourceResponseDto> {
    const resource = await this.findOrFail(id);
    const method = this.validateMethod(body.method);
    const path = this.validatePath(body.path);
    await this.assertOperationAvailable(method, path, id);
    await this.repository.update(resource, { method, path, description: body.description ?? null });
    return toResourceResponse(resource);
  }
  public async updatePatch(id: number, body: PatchResourceDto): Promise<ResourceResponseDto> {
    const resource = await this.findOrFail(id);
    const update: Partial<Pick<Resource, "method" | "path" | "description">> = {};
    const method = body.method === undefined ? resource.method : this.validateMethod(body.method);
    const path = body.path === undefined ? resource.path : this.validatePath(body.path);
    await this.assertOperationAvailable(method, path, id);
    if (body.method !== undefined) update.method = method;
    if (body.path !== undefined) update.path = path;
    if (body.description !== undefined) update.description = body.description;
    await this.repository.update(resource, update);
    return toResourceResponse(resource);
  }
  public async deletePhysical(id: number): Promise<void> {
    await this.repository.delete(await this.findOrFail(id, false));
  }
  public async deleteLogical(id: number): Promise<ResourceResponseDto> {
    const resource = await this.findOrFail(id);
    await this.repository.update(resource, { status: "inactive" });
    return toResourceResponse(resource);
  }

  private async findOrFail(id: number, onlyActive = true): Promise<Resource> {
    const resource = await this.repository.findById(id);
    if (!resource || (onlyActive && resource.status !== "active")) throw new AppError(404, "Resource not found");
    return resource;
  }
  private validateMethod(value: string): CreateResourceDto["method"] {
    const method = typeof value === "string" ? value.trim().toUpperCase() : "";
    if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) throw new AppError(400, "Invalid resource method");
    return method as CreateResourceDto["method"];
  }
  private validatePath(value: string): string {
    if (typeof value !== "string" || !value.trim().startsWith("/")) throw new AppError(400, "path must start with /");
    return normalizePath(value.trim());
  }
  private async assertOperationAvailable(method: string, path: string, excludeId?: number): Promise<void> {
    const existing = await this.repository.findByOperation(method, path);
    if (existing && existing.id !== excludeId) throw new AppError(409, `Resource ${method} ${path} already exists`);
  }
}