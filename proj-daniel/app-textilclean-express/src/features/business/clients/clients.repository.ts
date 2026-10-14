import { CreationAttributes, Transaction } from "sequelize";
import { Client, ClientI } from "./client.model";

/**
 * Capa Repository del feature Clients.
 *
 * Única responsable de hablar con Sequelize (el modelo `Client`).
 * No contiene reglas de negocio ni conoce `req`/`res`.
 */
export class ClientsRepository {
  /** Todos los clientes activos. */
  public async findAllActive(): Promise<Client[]> {
    return Client.findAll({ where: { status: "active" } });
  }

  /** Un cliente por PK (o `null`). Acepta transacción para flujos de ventas. */
  public async findById(id: number, transaction?: Transaction): Promise<Client | null> {
    return Client.findByPk(id, { transaction });
  }

  /** Inserta un cliente. */
  public async create(data: CreationAttributes<Client>): Promise<Client> {
    return Client.create(data);
  }

  /** Persiste cambios sobre una instancia existente. */
  public async update(client: Client, data: Partial<ClientI>): Promise<Client> {
    return client.update(data);
  }

  /** Elimina físicamente una instancia. */
  public async delete(client: Client): Promise<void> {
    await client.destroy();
  }
}