import { CreationAttributes, Transaction } from "sequelize";
import { Customer, CustomerI } from "./customer.model";

/**
 * Repository de Customers: única capa que habla con Sequelize.
 * Sin reglas de negocio ni `req`/`res`.
 */
export class CustomersRepository {
  public async findAllActive(): Promise<Customer[]> {
    return Customer.findAll({ where: { status: "active" }, order: [["business_name", "ASC"]] });
  }

  /** Acepta transacción para los flujos de órdenes de servicio. */
  public async findById(id: number, transaction?: Transaction): Promise<Customer | null> {
    return Customer.findByPk(id, { transaction });
  }

  public async create(data: CreationAttributes<Customer>): Promise<Customer> {
    return Customer.create(data);
  }

  public async update(customer: Customer, data: Partial<CustomerI>): Promise<Customer> {
    return customer.update(data);
  }

  public async delete(customer: Customer): Promise<void> {
    await customer.destroy();
  }
}
