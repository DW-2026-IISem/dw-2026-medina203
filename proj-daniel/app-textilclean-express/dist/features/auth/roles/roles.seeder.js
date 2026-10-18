"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEED_ROLES = void 0;
exports.seedRoles = seedRoles;
const role_model_1 = require("./role.model");
exports.SEED_ROLES = [
    { name: "ADMIN", description: "Administración del sistema: gestiona usuarios, roles y permisos" },
    { name: "SELLER", description: "Operación de ventas: consulta catálogo y registra ventas" },
];
async function seedRoles() {
    let created = 0;
    for (const item of exports.SEED_ROLES) {
        const [role, wasCreated] = await role_model_1.Role.findOrCreate({
            where: { name: item.name },
            defaults: { ...item, status: "active" },
        });
        if (wasCreated)
            created += 1;
        else if (role.status !== "active")
            await role.update({ status: "active" });
    }
    return created;
}
//# sourceMappingURL=roles.seeder.js.map