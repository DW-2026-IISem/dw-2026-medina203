"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsController = void 0;
const base_controller_1 = require("../../../shared/http/base-controller");
const clients_service_1 = require("./clients.service");
/**
 * Capa Controller del feature Clients.
 * Solo HTTP: lee req, llama al service y arma res.
 */
class ClientsController extends base_controller_1.BaseController {
    constructor(service = new clients_service_1.ClientsService()) {
        super();
        this.service = service;
    }
    // ================== READ ==================
    async getAll(_req, res) {
        await this.run(res, async () => {
            const clients = await this.service.getAll();
            res.status(200).json({ clients });
        });
    }
    async getOne(req, res) {
        await this.run(res, async () => {
            const client = await this.service.getOne(this.paramId(req));
            res.status(200).json({ client });
        });
    }
    // ================== CREATE ==================
    async create(req, res) {
        await this.run(res, async () => {
            const client = await this.service.create(req.body);
            res.status(201).json({ client });
        });
    }
    // ================== UPDATE ==================
    async updatePut(req, res) {
        await this.run(res, async () => {
            const client = await this.service.updatePut(this.paramId(req), req.body);
            res.status(200).json({ client });
        });
    }
    async updatePatch(req, res) {
        await this.run(res, async () => {
            const client = await this.service.updatePatch(this.paramId(req), req.body);
            res.status(200).json({ client });
        });
    }
    // ================== DELETE ==================
    async deletePhysical(req, res) {
        await this.run(res, async () => {
            const id = this.paramId(req);
            await this.service.deletePhysical(id);
            res.status(200).json({ message: "Client permanently deleted", id });
        });
    }
    async deleteLogical(req, res) {
        await this.run(res, async () => {
            const client = await this.service.deleteLogical(this.paramId(req));
            res.status(200).json({ message: "Client deactivated (logical delete)", client });
        });
    }
}
exports.ClientsController = ClientsController;
//# sourceMappingURL=clients.controller.js.map