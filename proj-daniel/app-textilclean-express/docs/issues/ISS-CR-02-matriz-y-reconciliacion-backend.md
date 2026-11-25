# ISS-CR-02 · Guardado de la matriz en el backend — TextilClean

**Depende de:** ISS-CR-01. **Habilita:** ISS-CR-03 (frontend).

## Objetivo

Que `POST /api/concesiones-rol` reciba el **conjunto completo** de recursos de un
rol y deje sus concesiones exactamente iguales, en una transacción.

## Contrato

```http
POST /api/concesiones-rol
Authorization: Bearer <access_token con permiso POST /api/concesiones-rol>
Content-Type: application/json

{ "role_id": 3, "resource_ids": [1, 2, 3] }
```

```json
200 { "message": "Role permissions updated",
      "result": { "role_id": 3, "activated": 3, "deactivated": 0, "total_active": 3 } }
```

La forma individual `{ role_id, resource_id }` → `201 { grant }` se conserva
(la usa la pantalla de concesiones de ISS-10). El controller decide por la
presencia de `resource_ids`; mandar las dos formas es `400`.

## Reconciliación

| Situación | Acción |
|---|---|
| ID enviado sin concesión | se crea activa |
| ID enviado con concesión inactiva | se reactiva |
| ID enviado con concesión activa | sin cambios (idempotente) |
| concesión activa no enviada | se revoca (`status = inactive`, la fila se conserva) |

Desmarcar una casilla **revoca** el acceso; no es el endpoint `DELETE` de la
entidad (eso es la columna "Eliminar") ni borra filas de `resource_roles`.

## Validaciones y errores

| Capa | Regla | Respuesta |
|---|---|---|
| Controller (`parseReconcileBody`) | cuerpo objeto JSON | 400 |
| Controller | `role_id` entero positivo | 400 |
| Controller | `resource_ids` arreglo de enteros positivos | 400 |
| Controller | sin duplicados (el mensaje lista los IDs repetidos) | 400 |
| Controller | no mezclar `resource_id` con `resource_ids` | 400 |
| Service | rol existe y está activo | 404 |
| Service (dentro de la transacción) | todos los recursos existen y están activos (lista los faltantes) | 400 |
| Service | ADMIN conserva `GET /api/roles`, `GET /api/recursos`, `GET` y `POST /api/concesiones-rol` | 409 |
| Middleware (`protect`) | sin JWT / sin concesión `POST /api/concesiones-rol` | 401 / 403 |

`resource_ids: []` es deliberado: **revoca todos** los permisos del rol.

La regla 409 evita el bloqueo administrativo: si ADMIN perdiera esos cuatro
permisos, nadie podría volver a abrir ni guardar la matriz.

## Archivos

| Capa | Archivo | Cambio |
|---|---|---|
| DTO | `resource-roles/dto/reconcile-resource-roles.dto.ts` | **Nuevo**: `ReconcileResourceRolesDto`, `ReconcileResult`, `isReconcileBody`, `parseReconcileBody`, `findDuplicateIds` |
| Controller | `resource-roles.controller.ts` | `grant()` atiende las dos formas del `POST` |
| Service | `resource-roles.service.ts` | `reconcileRole` estricto (400 en duplicados/faltantes), validación de recursos dentro de la transacción, guarda de ADMIN |
| Repository | `resource-roles.repository.ts` | sin cambios: ya aceptaba `transaction` |
| Route | `resource-roles.routes.ts` | sin cambios: `POST` ya usa `...protect` |
| Swagger | `resource-roles.swagger.ts` | `oneOf` de cuerpo, ejemplos y respuesta `200` |
| HTTP | `http/resource-roles.http` | ejemplos de matriz, vacía, duplicados, inexistente y rol inválido |
| Pruebas | `src/scripts/test-reconcile.ts` | **Nuevo** `npm run test:reconcile` |
| Smoke | `src/scripts/smoke-e2e.ts` | sección "Matriz de permisos" |

El seeder `resource-roles.seeder.ts` sigue usando `reconcileRole`.

## Pruebas

`npm run test:reconcile` (service contra la BD, solo con los roles descartables
`QA_MATRIZ` y `QA_MATRIZ_INACTIVO`):

```text
✅ alta: concede la lista completa
✅ idempotente: repetir la misma lista no cambia nada
✅ revocación + reactivación: quita lo no enviado y reactiva lo inactivo
✅ duplicados → 400 sin cambios
✅ recurso inexistente → 400 sin cambios
✅ recurso inactivo → 400 sin cambios
✅ rol inexistente → 404
✅ rol inactivo → 404 sin cambios
✅ rollback: un fallo a mitad de la transacción no deja cambios parciales
✅ ADMIN no puede perder el acceso al panel → 409 sin cambios
✅ lista vacía: revoca todas las concesiones activas del rol
✅ forma HTTP: valida objeto, role_id, arreglo, enteros, duplicados y forma mixta
✅ 12 OK, 0 fallida(s)
```

El rollback se prueba inyectando en el service un repository que lanza un
error en la segunda escritura: la primera escritura se revierte.

`npm run smoke` (HTTP contra el servidor en ejecución):

```text
— Matriz de permisos (ISS-CR-02)
✅ matriz sin token → 401
✅ matriz con token de operador → 403
✅ matriz con ids duplicados → 400
✅ matriz con recurso inexistente → 400
✅ matriz con rol inexistente → 404
✅ resource_id y resource_ids a la vez → 400
✅ entradas inválidas no cambian la matriz → 1
✅ guardar matriz sin GET /api/clientes → 200
✅ respuesta con result.total_active → 1
✅ operador lista clientes tras revocar → 403
✅ restaurar matriz original del operador → 200
✅ operador lista clientes tras restaurar → 200
```

El smoke restaura siempre la matriz original de OPERATOR (`finally`).

## Comprobación manual segura

Con un rol de prueba (créalo con `POST /api/roles`, nunca el único ADMIN real),
usa `http/resource-roles.http` o:

```bash
curl -i -X POST "$API_URL/concesiones-rol" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"role_id":3,"resource_ids":[1,2]}'
```

`API_URL` y `TOKEN` se definen localmente (`npm run dev:token -- admin`); no se
pegan en commits ni capturas.

## Criterios de aceptación

- [x] La reconciliación es idempotente y transaccional.
- [x] Las entradas inválidas no dejan cambios parciales.
- [x] La respuesta informa cambios y total activo.
- [x] La ruta exige JWT y permiso RBAC de administración.
- [x] Pruebas cubren alta, revocación, duplicados, rol inválido y rollback.
- [x] Se prueba con datos descartables, no con el único administrador real.
