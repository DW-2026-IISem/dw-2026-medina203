import {
  CreateGarmentTypeDto,
  GARMENT_TYPE_EDITABLE_FIELDS,
  GarmentTypeResponseDto,
  PatchGarmentTypeDto,
  UpdateGarmentTypeDto,
  toGarmentTypeResponse,
} from "./dto";
import { GarmentTypesRepository } from "./garment-types.repository";
import { GarmentType, GarmentTypeI } from "./garment-type.model";
import { AppError } from "../../../shared/errors/app-error";
import { pickFields } from "../../../shared/http/pick-fields";

/** Service de GarmentTypes. */
export class GarmentTypesService {
  public constructor(
    private readonly repository: GarmentTypesRepository = new GarmentTypesRepository()
  ) {}

  public async getAll(): Promise<GarmentTypeResponseDto[]> {
    return (await this.repository.findAllActive()).map(toGarmentTypeResponse);
  }

  public async getOne(id: number): Promise<GarmentTypeResponseDto> {
    return toGarmentTypeResponse(await this.findOrFail(id));
  }

  public async create(body: CreateGarmentTypeDto): Promise<GarmentTypeResponseDto> {
    const garmentType = await this.repository.create({
      name: body.name,
      description: body.description ?? null,
      status: body.status ?? "active",
    });
    return toGarmentTypeResponse(garmentType);
  }

  public async updatePut(id: number, body: UpdateGarmentTypeDto): Promise<GarmentTypeResponseDto> {
    const garmentType = await this.findOrFail(id);
    await this.repository.update(garmentType, {
      name: body.name,
      description: body.description ?? null,
    });
    return toGarmentTypeResponse(garmentType);
  }

  public async updatePatch(id: number, body: PatchGarmentTypeDto): Promise<GarmentTypeResponseDto> {
    const garmentType = await this.findOrFail(id);
    const changes = pickFields<GarmentTypeI, (typeof GARMENT_TYPE_EDITABLE_FIELDS)[number]>(
      body,
      GARMENT_TYPE_EDITABLE_FIELDS
    );
    await this.repository.update(garmentType, changes);
    return toGarmentTypeResponse(garmentType);
  }

  public async deletePhysical(id: number): Promise<void> {
    await this.repository.delete(await this.findOrFail(id, false));
  }

  public async deleteLogical(id: number): Promise<GarmentTypeResponseDto> {
    const garmentType = await this.findOrFail(id);
    await this.repository.update(garmentType, { status: "inactive" });
    return toGarmentTypeResponse(garmentType);
  }

  private async findOrFail(id: number, onlyActive = true): Promise<GarmentType> {
    const garmentType = await this.repository.findById(id);
    if (!garmentType || (onlyActive && garmentType.status !== "active")) {
      throw new AppError(404, "Garment type not found");
    }
    return garmentType;
  }
}
