"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsRepository = void 0;
const client_model_1 = require("./client.model");
/**
 * Capa Repository del feature Clients.
 *
 * Única responsable de hablar con Sequelize (el modelo `Client`).
 * No contiene reglas de negocio ni conoce `req`/`res`.
 */
class ClientsRepository {
    /** Todos los clientes activos. */
    async findAllActive() {
        return client_model_1.Client.findAll({ where: { status: "active" } });
    }
    /** Un cliente por PK (o `null`). Acepta transacción para flujos de ventas. */
    async findById(id, transaction) {
        return client_model_1.Client.findByPk(id, { transaction });
    }
    /** Inserta un cliente. */
    async create(data) {
        return client_model_1.Client.create(data);
    }
    /** Persiste cambios sobre una instancia existente. */
    async update(client, data) {
        return client.update(data);
    }
    /** Elimina físicamente una instancia. */
    async delete(client) {
        await client.destroy();
    }
}
exports.ClientsRepository = ClientsRepository;
//# sourceMappingURL=clients.repository.js.map