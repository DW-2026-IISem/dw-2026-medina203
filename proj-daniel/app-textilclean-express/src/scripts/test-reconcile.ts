import assert from "node:assert/strict";
import dotenv from "dotenv";
import { Transaction } from "sequelize";
import { sequelize, testConnection } from "../database/db";
import "../features/auth/users/user.model";
import "../features/auth/roles/role.model";
import "../features/auth/resources/resource.model";
import "../features/auth/role-users/role-user.model";
import "../features/auth/resource-roles/resource-role.model";
import "../features/auth/rbac.associations";
import { Resource } from "../features/auth/resources/resource.model";
import { Role } from "../features/auth/roles/role.model";
import { ResourceRole } from "../features/auth/resource-roles/resource-role.model";
import { ResourceRolesRepository } from "../features/auth/resource-roles/resource-roles.repository";
import { ResourceRolesService } from "../features/auth/resource-roles/resource-roles.service";
import { parseReconcileBody } from "../features/auth/resource-roles/dto";
import { AppError } from "../shared/errors/app-error";

dotenv.config({ quiet: true });

/**
 * Pruebas de la reconciliación de la matriz (ISS-CR-02) contra una BD de pruebas.
 *
 *   npm run test:reconcile
 *
 * Trabaja SOLO con roles descartables (`QA_MATRIZ`, `QA_MATRIZ_INACTIVO`) que
 * crea si no existen; nunca modifica ADMIN ni OPERATOR.
 */
const QA_ROLE = "QA_MATRIZ";
const QA_INACTIVE_ROLE = "QA_MATRIZ_INACTIVO";

let passed = 0;
let failed = 0;

async function test(name: string, body: () => Promise<void>): Promise<void> {
  try {
    await body();
    passed += 1;
    console.log(`✅ ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`❌ ${name}\n   ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function expectAppError(work: () => unknown, status: number, contains?: string): Promise<void> {
  try {
    await work();
  } catch (error) {
    assert.ok(error instanceof AppError, `se esperaba AppError, llegó ${String(error)}`);
    assert.equal(error.statusCode, status, `status ${error.statusCode} (${error.message})`);
    if (contains) assert.ok(error.message.includes(contains), `mensaje: ${error.message}`);
    return;
  }
  assert.fail(`se esperaba error ${status} y no hubo error`);
}

async function activeIds(roleId: number): Promise<number[]> {
  const rows = await ResourceRole.findAll({ where: { role_id: roleId, status: "active" }, order: [["resource_id", "ASC"]] });
  return rows.map((row) => row.resource_id);
}

/** Repository que falla en la N-ésima escritura: simula una caída a mitad de la transacción. */
class FailingRepository extends ResourceRolesRepository {
  private writes = 0;
  public constructor(private readonly failAt: number) { super(); }
  private tick(): void {
    this.writes += 1;
    if (this.writes === this.failAt) throw new Error("fallo simulado durante la transacción");
  }
  public override create(data: Parameters<ResourceRolesRepository["create"]>[0], transaction?: Transaction) {
    this.tick();
    return super.create(data, transaction);
  }
  public override update(row: ResourceRole, data: Partial<ResourceRole>, transaction?: Transaction) {
    this.tick();
    return super.update(row, data, transaction);
  }
}

async function main(): Promise<void> {
  if (!(await testConnection())) throw new Error("No hay conexión a la base de datos");
  const [role] = await Role.findOrCreate({ where: { name: QA_ROLE }, defaults: { name: QA_ROLE, description: "Rol descartable de pruebas", status: "active" } });
  if (role.status !== "active") await role.update({ status: "active" });
  const [inactiveRole] = await Role.findOrCreate({ where: { name: QA_INACTIVE_ROLE }, defaults: { name: QA_INACTIVE_ROLE, description: "Rol inactivo de pruebas", status: "inactive" } });
  if (inactiveRole.status !== "inactive") await inactiveRole.update({ status: "inactive" });
  const adminRole = await Role.findOne({ where: { name: "ADMIN" } });

  const resources = await Resource.findAll({ where: { status: "active" }, order: [["id", "ASC"]], limit: 5 });
  assert.ok(resources.length === 5, "se necesitan recursos sembrados (npm run db:seed)");
  const [r1, r2, r3, r4, r5] = resources.map((resource) => resource.id);
  const service = new ResourceRolesService();

  console.log(`🧪 Reconciliación de la matriz con el rol ${QA_ROLE} (#${role.id})\n`);
  await service.reconcileRole(role.id, []);

  await test("alta: concede la lista completa", async () => {
    const result = await service.reconcileRole(role.id, [r3, r1, r2]);
    assert.deepEqual(result, { role_id: role.id, activated: 3, deactivated: 0, total_active: 3 });
    assert.deepEqual(await activeIds(role.id), [r1, r2, r3]);
  });

  await test("idempotente: repetir la misma lista no cambia nada", async () => {
    const result = await service.reconcileRole(role.id, [r1, r2, r3]);
    assert.equal(result.activated, 0);
    assert.equal(result.deactivated, 0);
  });

  await test("revocación + reactivación: quita lo no enviado y reactiva lo inactivo", async () => {
    const first = await service.reconcileRole(role.id, [r1, r4]);
    assert.deepEqual([first.activated, first.deactivated], [1, 2]);
    const second = await service.reconcileRole(role.id, [r1, r2, r4]);
    assert.deepEqual([second.activated, second.deactivated], [1, 0]);
    assert.deepEqual(await activeIds(role.id), [r1, r2, r4]);
    const revoked = await ResourceRole.findOne({ where: { role_id: role.id, resource_id: r3 } });
    assert.equal(revoked?.status, "inactive", "la revocación es lógica (fila inactiva), no física");
  });

  await test("duplicados → 400 sin cambios", async () => {
    await expectAppError(() => service.reconcileRole(role.id, [r1, r1, r5]), 400, "duplicated");
    assert.deepEqual(await activeIds(role.id), [r1, r2, r4]);
  });

  await test("recurso inexistente → 400 sin cambios", async () => {
    await expectAppError(() => service.reconcileRole(role.id, [r1, 999999]), 400, "999999");
    assert.deepEqual(await activeIds(role.id), [r1, r2, r4]);
  });

  await test("recurso inactivo → 400 sin cambios", async () => {
    const resource = await Resource.findByPk(r5);
    await resource!.update({ status: "inactive" });
    try {
      await expectAppError(() => service.reconcileRole(role.id, [r1, r5]), 400, String(r5));
    } finally {
      await resource!.update({ status: "active" });
    }
    assert.deepEqual(await activeIds(role.id), [r1, r2, r4]);
  });

  await test("rol inexistente → 404", async () => {
    await expectAppError(() => service.reconcileRole(999999, [r1]), 404);
  });

  await test("rol inactivo → 404 sin cambios", async () => {
    const before = await activeIds(inactiveRole.id);
    await expectAppError(() => service.reconcileRole(inactiveRole.id, [r1]), 404);
    assert.deepEqual(await activeIds(inactiveRole.id), before);
  });

  await test("rollback: un fallo a mitad de la transacción no deja cambios parciales", async () => {
    const failing = new ResourceRolesService(new FailingRepository(2));
    await assert.rejects(() => failing.reconcileRole(role.id, [r3, r5]), /fallo simulado/);
    assert.deepEqual(await activeIds(role.id), [r1, r2, r4]);
  });

  await test("ADMIN no puede perder el acceso al panel → 409 sin cambios", async () => {
    assert.ok(adminRole, "falta el rol ADMIN sembrado");
    const before = await activeIds(adminRole.id);
    await expectAppError(() => service.reconcileRole(adminRole.id, []), 409, "ADMIN must keep");
    assert.deepEqual(await activeIds(adminRole.id), before);
  });

  await test("lista vacía: revoca todas las concesiones activas del rol", async () => {
    const result = await service.reconcileRole(role.id, []);
    assert.deepEqual(result, { role_id: role.id, activated: 0, deactivated: 3, total_active: 0 });
    assert.deepEqual(await activeIds(role.id), []);
  });

  await test("forma HTTP: valida objeto, role_id, arreglo, enteros, duplicados y forma mixta", async () => {
    await expectAppError(() => parseReconcileBody([1, 2]), 400, "JSON object");
    await expectAppError(() => parseReconcileBody({ role_id: "2", resource_ids: [] }), 400, "role_id");
    await expectAppError(() => parseReconcileBody({ role_id: 2, resource_ids: "1,2" }), 400, "array");
    await expectAppError(() => parseReconcileBody({ role_id: 2, resource_ids: [1, 0] }), 400, "positive");
    await expectAppError(() => parseReconcileBody({ role_id: 2, resource_ids: [1.5] }), 400, "positive");
    await expectAppError(() => parseReconcileBody({ role_id: 2, resource_ids: [3, 3] }), 400, "duplicated ids: 3");
    await expectAppError(() => parseReconcileBody({ role_id: 2, resource_id: 1, resource_ids: [1] }), 400, "not both");
    assert.deepEqual(parseReconcileBody({ role_id: 2, resource_ids: [] }), { role_id: 2, resource_ids: [] });
  });

  console.log(`\n${failed === 0 ? "✅" : "❌"} ${passed} OK, ${failed} fallida(s)`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("❌", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
