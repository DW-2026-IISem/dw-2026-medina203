import {
  CreateLaundryServiceDto,
  LAUNDRY_SERVICE_EDITABLE_FIELDS,
  LaundryServiceResponseDto,
  PatchLaundryServiceDto,
  UpdateLaundryServiceDto,
  toLaundryServiceResponse,
} from "./dto";
import { LaundryServicesRepository } from "./laundry-services.repository";
import { LaundryService, LaundryServiceI } from "./laundry-service.model";
import { GarmentTypesRepository } from "../garment-types/garment-types.repository";
import { AppError } from "../../../shared/errors/app-error";
import { pickFields } from "../../../shared/http/pick-fields";

/**
 * Service de LaundryServices.
 *
 * Regla clave: el tipo de prenda referenciado debe existir (404) y estar
 * activo (400). Se consulta vía `GarmentTypesRepository`, no vía el modelo.
 */
export class LaundryServicesService {
  public constructor(
    private readonly repository: LaundryServicesRepository = new LaundryServicesRepository(),
    private readonly garmentTypesRepository: GarmentTypesRepository = new GarmentTypesRepository()
  ) {}

  public async getAll(): Promise<LaundryServiceResponseDto[]> {
    return (await this.repository.findAllActive()).map(toLaundryServiceResponse);
  }

  public async getOne(id: number): Promise<LaundryServiceResponseDto> {
    return toLaundryServiceResponse(await this.findOrFail(id));
  }

  public async create(body: CreateLaundryServiceDto): Promise<LaundryServiceResponseDto> {
    await this.assertActiveGarmentType(body.garment_type_id);
    const service = await this.repository.create({
      name: body.name,
      description: body.description ?? null,
      price: body.price,
      billing_unit: body.billing_unit,
      estimated_hours: body.estimated_hours ?? 24,
      garment_type_id: body.garment_type_id,
      status: body.status ?? "active",
    });
    return toLaundryServiceResponse(service);
  }

  public async updatePut(id: number, body: UpdateLaundryServiceDto): Promise<LaundryServiceResponseDto> {
    const service = await this.findOrFail(id);
    await this.assertActiveGarmentType(body.garment_type_id);
    const updated = await this.repository.update(service, {
      name: body.name,
      description: body.description ?? null,
      price: body.price,
      billing_unit: body.billing_unit,
      estimated_hours: body.estimated_hours,
      garment_type_id: body.garment_type_id,
    });
    return toLaundryServiceResponse(updated);
  }

  public async updatePatch(id: number, body: PatchLaundryServiceDto): Promise<LaundryServiceResponseDto> {
    const service = await this.findOrFail(id);
    const changes = pickFields<LaundryServiceI, (typeof LAUNDRY_SERVICE_EDITABLE_FIELDS)[number]>(
      body,
      LAUNDRY_SERVICE_EDITABLE_FIELDS
    );
    if (changes.garment_type_id !== undefined) {
      await this.assertActiveGarmentType(changes.garment_type_id);
    }
    return toLaundryServiceResponse(await this.repository.update(service, changes));
  }

  public async deletePhysical(id: number): Promise<void> {
    await this.repository.delete(await this.findOrFail(id, false));
  }

  public async deleteLogical(id: number): Promise<LaundryServiceResponseDto> {
    const service = await this.findOrFail(id);
    return toLaundryServiceResponse(await this.repository.update(service, { status: "inactive" }));
  }

  private async findOrFail(id: number, onlyActive = true): Promise<LaundryService> {
    const service = await this.repository.findById(id);
    if (!service || (onlyActive && service.status !== "active")) {
      throw new AppError(404, "Laundry service not found");
    }
    return service;
  }

  /**
   * 400 (no 404) cuando el tipo existe pero está inactivo: el recurso de la URL
   * existe; lo que falla es la referencia que se intenta asignar.
   */
  private async assertActiveGarmentType(garmentTypeId: number): Promise<void> {
    if (!Number.isInteger(garmentTypeId) || garmentTypeId < 1) {
      throw new AppError(400, "garment_type_id must be a positive integer");
    }
    const garmentType = await this.garmentTypesRepository.findById(garmentTypeId);
    if (!garmentType) throw new AppError(404, "Garment type not found");
    if (garmentType.status !== "active") throw new AppError(400, "Garment type must be active");
  }
}
