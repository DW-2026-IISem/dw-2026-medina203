"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsService = void 0;
const dto_1 = require("./dto");
const clients_repository_1 = require("./clients.repository");
const app_error_1 = require("../../../shared/errors/app-error");
/**
 * Capa Service del feature Clients.
 *
 * Reglas de negocio: default de `status`, política de borrado lógico, borrado
 * físico y saneamiento de la respuesta (oculta `password`).
 */
class ClientsService {
    constructor(repository = new clients_repository_1.ClientsRepository()) {
        this.repository = repository;
    }
    // ================== READ ==================
    async getAll() {
        const clients = await this.repository.findAllActive();
        return clients.map((client) => (0, dto_1.toClientResponse)(client));
    }
    async getOne(id) {
        return (0, dto_1.toClientResponse)(await this.findOrFail(id));
    }
    // ================== CREATE ==================
    async create(body) {
        const client = await this.repository.create({
            name: body.name,
            address: body.address,
            phone: body.phone,
            email: body.email,
            password: body.password,
            status: body.status ?? "active",
        });
        return (0, dto_1.toClientResponse)(client);
    }
    // ================== UPDATE ==================
    async updatePut(id, body) {
        const client = await this.findOrFail(id);
        await this.repository.update(client, {
            name: body.name,
            address: body.address,
            phone: body.phone,
            email: body.email,
            password: body.password ?? client.password,
        });
        return (0, dto_1.toClientResponse)(client);
    }
    async updatePatch(id, body) {
        const client = await this.findOrFail(id);
        await this.repository.update(client, body);
        return (0, dto_1.toClientResponse)(client);
    }
    // ================== DELETE ==================
    /** Eliminación física. */
    async deletePhysical(id) {
        const client = await this.findOrFail(id, false);
        await this.repository.delete(client);
    }
    /** Eliminación lógica -> `status = inactive`. */
    async deleteLogical(id) {
        const client = await this.findOrFail(id);
        await this.repository.update(client, { status: "inactive" });
        return (0, dto_1.toClientResponse)(client);
    }
    // ================== HELPERS ==================
    /**
     * Busca por PK y falla con 404 si no existe.
     *
     * `onlyActive` (por defecto `true`) aplica la política de borrado lógico.
     */
    async findOrFail(id, onlyActive = true) {
        const client = await this.repository.findById(id);
        if (!client || (onlyActive && client.status !== "active")) {
            throw new app_error_1.AppError(404, "Client not found");
        }
        return client;
    }
}
exports.ClientsService = ClientsService;
//# sourceMappingURL=clients.service.js.map