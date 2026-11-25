/**
 * Smoke test E2E de TextilClean: recorre las 3 modalidades de acceso y el flujo
 * principal de una orden contra un servidor en ejecución.
 *
 *   npm run dev          # en otra terminal (con npm run db:seed ejecutado)
 *   npm run smoke        # o: BASE_URL=http://localhost:4000 npm run smoke
 */
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;

let failures = 0;

async function call(method: string, path: string, body?: unknown, token?: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

function check(label: string, actual: number, expected: number): void {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? "✅" : "❌"} ${label} → ${actual}${ok ? "" : ` (esperado ${expected})`}`);
}

async function login(identifier: string, password: string) {
  const res = await call("POST", "/api/sesion/login", { identifier, password });
  return { status: res.status, access: res.json?.access_token as string, refresh: res.json?.refresh_token as string };
}

async function main(): Promise<void> {
  console.log(`🧪 Smoke E2E contra ${BASE_URL}\n`);

  console.log("— OPEN");
  check("GET /api/docs.json", (await call("GET", "/api/docs.json")).status, 200);
  check("login con contraseña incorrecta", (await login("admin", "incorrecta")).status, 401);
  const admin = await login("admin", "Admin123!");
  check("login admin", admin.status, 200);
  const operator = await login("operador", "Operador123!");
  check("login operador", operator.status, 200);

  console.log("\n— JWT");
  check("perfil sin token", (await call("GET", "/api/sesion/perfil")).status, 401);
  check("perfil con token", (await call("GET", "/api/sesion/perfil", undefined, operator.access)).status, 200);
  check("mis sesiones", (await call("GET", "/api/sesiones", undefined, operator.access)).status, 200);
  check("mis permisos", (await call("GET", "/api/permisos", undefined, operator.access)).status, 200);

  console.log("\n— JWT + RBAC");
  check("negocio sin token", (await call("GET", "/api/clientes")).status, 401);
  check("admin lista usuarios", (await call("GET", "/api/usuarios", undefined, admin.access)).status, 200);
  check("operador lista usuarios (deny by default)", (await call("GET", "/api/usuarios", undefined, operator.access)).status, 403);
  check("operador cambia precio de servicio", (await call("PATCH", "/api/servicios/1", { price: 1 }, operator.access)).status, 403);

  console.log("\n— Flujo de una orden (operador)");
  const customers = await call("GET", "/api/clientes", undefined, operator.access);
  check("operador lista clientes", customers.status, 200);
  const services = await call("GET", "/api/servicios", undefined, operator.access);
  check("operador lista servicios", services.status, 200);
  const customer = customers.json?.customers?.[0];
  const byKg = services.json?.laundry_services?.find((s: any) => s.billing_unit === "kg");
  const byUnit = services.json?.laundry_services?.find((s: any) => s.billing_unit === "unit");
  if (!customer || !byKg || !byUnit) throw new Error("Faltan datos semilla: ejecuta npm run db:seed");

  const created = await call(
    "POST",
    "/api/ordenes",
    {
      customer_id: customer.id,
      items: [
        { laundry_service_id: byKg.id, quantity: 20, weight_kg: 10 },
        { laundry_service_id: byUnit.id, quantity: 5 },
      ],
    },
    operator.access
  );
  check("operador registra orden", created.status, 201);
  const order = created.json?.service_order;
  const expected = byKg.price * 10 + byUnit.price * 5;
  check(`total calculado (${order?.total} = ${expected})`, order?.total === expected ? 1 : 0, 1);

  for (const next of ["in_process", "ready", "delivered"]) {
    check(`avanza a ${next}`, (await call("PATCH", `/api/ordenes/${order.id}/estado`, { process_status: next }, operator.access)).status, 200);
  }
  check("modificar orden entregada", (await call("PATCH", `/api/ordenes/${order.id}`, { discount: 1 }, admin.access)).status, 409);
  check("operador elimina orden", (await call("DELETE", `/api/ordenes/${order.id}`, undefined, operator.access)).status, 403);
  check("admin elimina orden", (await call("DELETE", `/api/ordenes/${order.id}`, undefined, admin.access)).status, 200);

  console.log("\n— Matriz de permisos (ISS-CR-02)");
  await checkPermissionMatrix(admin.access, operator.access);

  console.log("\n— Refresh con rotación");
  const rotated = await call("POST", "/api/sesion/refresh", { refresh_token: operator.refresh });
  check("refresh", rotated.status, 200);
  check("reuso del refresh viejo", (await call("POST", "/api/sesion/refresh", { refresh_token: operator.refresh })).status, 401);
  check("logout admin", (await call("POST", "/api/sesion/logout", { refresh_token: admin.refresh })).status, 200);

  console.log(failures === 0 ? "\n🎉 Smoke E2E en verde" : `\n💥 ${failures} verificación(es) fallaron`);
  process.exitCode = failures === 0 ? 0 : 1;
}

/**
 * Guarda matrices completas y comprueba el efecto REAL sobre el acceso:
 * al operador se le retira `GET /api/clientes` (403) y luego se restaura (200).
 * La matriz original de OPERATOR se restaura siempre (finally).
 */
async function checkPermissionMatrix(adminToken: string, operatorToken: string): Promise<void> {
  const matrix = (body: unknown, token?: string) => call("POST", "/api/concesiones-rol", body, token);
  const roles = (await call("GET", "/api/roles", undefined, adminToken)).json?.roles ?? [];
  const operatorRole = roles.find((role: any) => role.name === "OPERATOR");
  const resources = (await call("GET", "/api/recursos", undefined, adminToken)).json?.resources ?? [];
  const listCustomers = resources.find((r: any) => r.method === "GET" && r.path === "/api/clientes");
  if (!operatorRole || !listCustomers) throw new Error("Faltan datos semilla: ejecuta npm run db:seed");

  const grants = (await call("GET", `/api/concesiones-rol?role_id=${operatorRole.id}`, undefined, adminToken)).json?.grants ?? [];
  const original: number[] = grants.map((grant: any) => grant.resource_id);

  check("matriz sin token", (await matrix({ role_id: operatorRole.id, resource_ids: original })).status, 401);
  check("matriz con token de operador", (await matrix({ role_id: operatorRole.id, resource_ids: original }, operatorToken)).status, 403);
  check("matriz con ids duplicados", (await matrix({ role_id: operatorRole.id, resource_ids: [listCustomers.id, listCustomers.id] }, adminToken)).status, 400);
  check("matriz con recurso inexistente", (await matrix({ role_id: operatorRole.id, resource_ids: [999999] }, adminToken)).status, 400);
  check("matriz con rol inexistente", (await matrix({ role_id: 999999, resource_ids: [] }, adminToken)).status, 404);
  check("resource_id y resource_ids a la vez", (await matrix({ role_id: operatorRole.id, resource_id: 1, resource_ids: [] }, adminToken)).status, 400);
  const afterInvalid = (await call("GET", `/api/concesiones-rol?role_id=${operatorRole.id}`, undefined, adminToken)).json?.grants ?? [];
  check("entradas inválidas no cambian la matriz", afterInvalid.length === original.length ? 1 : 0, 1);

  try {
    const without = original.filter((id) => id !== listCustomers.id);
    const revoked = await matrix({ role_id: operatorRole.id, resource_ids: without }, adminToken);
    check("guardar matriz sin GET /api/clientes", revoked.status, 200);
    check("respuesta con result.total_active", revoked.json?.result?.total_active === without.length ? 1 : 0, 1);
    check("operador lista clientes tras revocar", (await call("GET", "/api/clientes", undefined, operatorToken)).status, 403);
  } finally {
    const restored = await matrix({ role_id: operatorRole.id, resource_ids: original }, adminToken);
    check("restaurar matriz original del operador", restored.status, 200);
  }
  check("operador lista clientes tras restaurar", (await call("GET", "/api/clientes", undefined, operatorToken)).status, 200);
}

main().catch((error) => {
  console.error("❌", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
