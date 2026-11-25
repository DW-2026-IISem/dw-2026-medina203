import {
  CUSTOMER_EDITABLE_FIELDS,
  CreateCustomerDto,
  CustomerResponseDto,
  PatchCustomerDto,
  UpdateCustomerDto,
  toCustomerResponse,
} from "./dto";
import { CustomersRepository } from "./customers.repository";
import { Customer, CustomerI } from "./customer.model";
import { AppError } from "../../../shared/errors/app-error";
import { pickFields } from "../../../shared/http/pick-fields";

/**
 * Service de Customers: reglas de negocio (estado por defecto, borrado lógico
 * y físico, whitelist de campos editables).
 */
export class CustomersService {
  public constructor(
    private readonly repository: CustomersRepository = new CustomersRepository()
  ) {}

  // ================== READ ==================
  public async getAll(): Promise<CustomerResponseDto[]> {
    const customers = await this.repository.findAllActive();
    return customers.map(toCustomerResponse);
  }

  public async getOne(id: number): Promise<CustomerResponseDto> {
    return toCustomerResponse(await this.findOrFail(id));
  }

  // ================== CREATE ==================
  public async create(body: CreateCustomerDto): Promise<CustomerResponseDto> {
    // Copia campo a campo: protección contra mass assignment.
    const customer = await this.repository.create({
      business_name: body.business_name,
      tax_id: body.tax_id,
      contact_name: body.contact_name ?? null,
      phone: body.phone,
      email: body.email,
      address: body.address ?? null,
      status: body.status ?? "active",
    });
    return toCustomerResponse(customer);
  }

  // ================== UPDATE ==================
  public async updatePut(id: number, body: UpdateCustomerDto): Promise<CustomerResponseDto> {
    const customer = await this.findOrFail(id);
    await this.repository.update(customer, {
      business_name: body.business_name,
      tax_id: body.tax_id,
      contact_name: body.contact_name ?? null,
      phone: body.phone,
      email: body.email,
      address: body.address ?? null,
    });
    return toCustomerResponse(customer);
  }

  public async updatePatch(id: number, body: PatchCustomerDto): Promise<CustomerResponseDto> {
    const customer = await this.findOrFail(id);
    const changes = pickFields<CustomerI, (typeof CUSTOMER_EDITABLE_FIELDS)[number]>(
      body,
      CUSTOMER_EDITABLE_FIELDS
    );
    await this.repository.update(customer, changes);
    return toCustomerResponse(customer);
  }

  // ================== DELETE ==================
  /** Borrado físico: elimina la fila (también si ya estaba inactiva). */
  public async deletePhysical(id: number): Promise<void> {
    const customer = await this.findOrFail(id, false);
    await this.repository.delete(customer);
  }

  /** Borrado lógico: `status = inactive`. */
  public async deleteLogical(id: number): Promise<CustomerResponseDto> {
    const customer = await this.findOrFail(id);
    await this.repository.update(customer, { status: "inactive" });
    return toCustomerResponse(customer);
  }

  // ================== HELPERS ==================
  /** 404 si no existe; con `onlyActive` (por defecto) también si está inactivo. */
  private async findOrFail(id: number, onlyActive = true): Promise<Customer> {
    const customer = await this.repository.findById(id);
    if (!customer || (onlyActive && customer.status !== "active")) {
      throw new AppError(404, "Customer not found");
    }
    return customer;
  }
}
