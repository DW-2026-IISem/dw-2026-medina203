# ISS-CR-00 · Contexto y contrato del panel de roles y permisos — TextilClean

**Ruta:** ISS-Crud (panel de roles y permisos) del tutor, adaptada a TextilClean.
**Depende de:** ISS-12/13 (pivotes y middlewares RBAC) y del frontend ISS-10.
**Habilita:** ISS-CR-01.

## Contexto

TextilClean ya autoriza cada petición en Express con `authenticate` + `authorize`
(JWT + RBAC). La matriz de permisos vive en `resource_roles`; la fila activa
**es** el permiso. Hasta ahora el administrador concedía o retiraba permisos de
uno en uno (`/admin/permisos`, ISS-10 del frontend). Esta ruta agrega un panel
que muestra los permisos de un rol como matriz **C/R/U/D por entidad** y los
guarda **todos de una vez**.

> La pantalla es una herramienta administrativa. **Nunca** calcula permisos
> efectivos para proteger una API: la autoridad final es el backend.

## Qué NO se copia de PedalLibre

| PedalLibre (referencia) | TextilClean (este proyecto) |
|---|---|
| `users.role_id` (un rol por usuario) | pivote `role_users` (varios roles por usuario) |
| carpeta genérica `src/features/crud/` | una carpeta por feature (`features/business/*`, `features/auth/*`) |
| `AdminPage` única con secciones | páginas por feature en `features/admin/*` |
| entidades `stations`, `rentals`… | `clientes`, `tipos-prenda`, `servicios`, `ordenes`, `detalle-ordenes` |

No se crea `features/crud` en ningún proyecto: la matriz extiende la feature
RBAC existente `src/features/auth/resource-roles/` (backend) y la pantalla
existente `src/app/features/admin/resource-roles/` (frontend).

## Recorrido

```text
Angular ResourceRoleList (estado y eventos, signals)
  → ResourceRoleApi (URLs, HttpParams, validación de envolturas)
  → HttpClient → authInterceptor (Bearer) → errorInterceptor
  → Express: protect = authenticate + authorize ("POST /api/concesiones-rol")
  → ResourceRolesController (forma HTTP del cuerpo)
  → ResourceRolesService.reconcileRole (reglas + transacción)
  → ResourceRolesRepository (Sequelize) → resource_roles
```

## Contrato

| Acción | Método y ruta | Respuesta |
|---|---|---|
| Listar roles | `GET /api/roles` | `{ "roles": [...] }` |
| Listar recursos | `GET /api/recursos` | `{ "resources": [...] }` |
| Concesiones de un rol | `GET /api/concesiones-rol?role_id=<id>` | `{ "grants": [...] }` (solo activas) |
| **Guardar matriz completa** | `POST /api/concesiones-rol` | `200 { "message": "Role permissions updated", "result": {...} }` |
| Conceder uno (se conserva) | `POST /api/concesiones-rol` con `resource_id` | `201 { "grant": {...} }` |
| Permisos efectivos propios | `GET /api/permisos` | `{ "permissions": [...] }` |

Petición de matriz (estado final deseado, no una operación por casilla):

```json
{ "role_id": 2, "resource_ids": [1, 2, 3, 22, 23] }
```

Respuesta:

```json
{
  "message": "Role permissions updated",
  "result": { "role_id": 2, "activated": 1, "deactivated": 3, "total_active": 5 }
}
```

El mismo `POST` distingue las dos formas por la presencia de `resource_ids`
(matriz) o `resource_id` (concesión individual). Enviar ambas es **400**.

## Agrupación de la matriz (decisiones)

Cada recurso se ubica por **entidad** = segmento después de `/api/`
(`/api/tipos-prenda/:id` → `tipos-prenda`) y por **operación**:

| Columna | Recursos que agrupa |
|---|---|
| Crear (C) | `POST /api/<entidad>` |
| Leer (R) | `GET /api/<entidad>` y `GET /api/<entidad>/:id` |
| Actualizar (U) | `PUT` y `PATCH` sobre `/api/<entidad>/:id` |
| Eliminar (D) | `DELETE /api/<entidad>/:id` |
| Acciones especiales | cualquier ruta con un segmento después de `:id` |

Acciones especiales de TextilClean (una casilla por recurso, con su descripción):

- `PATCH /api/<entidad>/:id/deactivate` — baja lógica (no es "Eliminar").
- `PATCH /api/<entidad>/:id/reactivate` — en asignaciones y concesiones.
- `PATCH /api/ordenes/:id/estado` — avanzar el proceso de lavado
  (`received → in_process → ready → delivered`). No se agrupa con
  "Actualizar" porque el operario lo necesita sin poder editar la orden.
- `PATCH /api/usuarios/:id/password` y `GET /api/usuarios/:id/permisos`.

Una celda sin recursos muestra **"No disponible"** (p. ej. `asignaciones-rol`
no tiene `PUT`/`PATCH`/`DELETE`): no se pinta una casilla deshabilitada que
sugiera una operación inexistente.

## Respuestas a las preguntas de diseño

1. **¿Por qué ocultar un botón no protege?** Porque cualquiera puede llamar la API
   con `curl`; `authorize` revisa `method + path` contra la matriz en cada petición.
2. **Recurso activo con concesión revocada:** el rol recibe `403` en esa ruta.
3. **`PATCH /api/ordenes/:id/estado` ≠ `PATCH /api/ordenes/:id`:** son dos filas de
   `resources`; `authorize` compara el patrón exacto.
4. **Concesión ya activa y se vuelve a marcar:** la reconciliación no cambia nada
   (idempotente: `activated = 0`).
5. **Error de validación:** `{ "error": "..." }` con `400/404/409`, que el
   frontend muestra tal cual.

## Criterios de aceptación

- [x] Flujo frontend → API → persistencia sin saltar capas.
- [x] `role_id` (rol) se diferencia de `resource_id` (operación).
- [x] El servidor autoriza cada petición.
- [x] Contrato de consulta y guardado acordado antes de implementar.
- [x] "Actualizar" = `PUT` + `PATCH :id`.
- [x] Endpoints especiales en columna propia, documentados.
- [x] No se crean carpetas `features/crud`: se extienden las features existentes.
