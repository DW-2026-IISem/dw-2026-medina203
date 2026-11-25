# ISS-CR-03 · Cliente HTTP y panel de matriz — TextilClean

**Depende de:** backend ISS-CR-02 (`POST /api/concesiones-rol` con `resource_ids`)
y la sesión JWT de ISS-08. **Habilita:** ISS-CR-04.
**Contrato:** `app-textilclean-express/docs/issues/ISS-CR-00-contexto-y-contrato.md`.

## Objetivo

Pantalla administrativa que elige un rol, muestra sus permisos C/R/U/D por
entidad y guarda la matriz completa con el endpoint de reconciliación.

## Recorrido

```text
PermissionMatrix (signals: estado y eventos)
  → ResourceRoleApi / RoleApi / ResourceApi (URLs, HttpParams, envolturas)
  → HttpClient → authInterceptor (Bearer, refresh único) → errorInterceptor
  → Express (authenticate + authorize)
```

## Decisión: una sola pantalla para la matriz

TextilClean ya tenía en `/admin/permisos` la lista plana "Concesiones rol ↔
recurso" (ISS-10). La ruta del tutor pide no mantener dos paneles que
administren la misma matriz, así que **esa lista se reemplazó** por la matriz:

| Antes (ISS-10) | Ahora (ISS-CR-03) |
|---|---|
| `resource-roles/resource-role-list/` (fila por concesión, conceder/revocar de a una) | `resource-roles/permission-matrix/` (matriz por rol, guardado atómico) |
| Menú "Concesiones" | Menú "Roles y permisos" (misma ruta y mismo permiso `GET /api/concesiones-rol`) |

No se creó `features/crud` ni `features/admin/role-permissions`: la matriz vive
en la feature que ya administraba concesiones.

## Archivos

| Archivo | Cambio |
|---|---|
| `core/models/resource-role.model.ts` (+ `admin.model.ts`) | `RoleGrantReconciliationPayload { role_id, resource_ids }` y `RoleGrantReconciliation { role_id, activated, deactivated, total_active }` |
| `features/admin/resource-roles/resource-role-api.ts` | `reconcileRole(role_id, resource_ids)`; `list()` y `reconcileRole()` validan las envolturas `grants` y `result` y lanzan un error legible si faltan |
| `features/admin/resource-roles/permission-matrix.ts` | **Nuevo**: funciones puras `buildPermissionMatrix`, `entityOf`, `crudOperationOf`, `grantState`, `toggleIds`, `countChanges`, `specialLabel` y `CRUD_COLUMNS` |
| `features/admin/resource-roles/permission-matrix/` | **Nuevo** componente `PermissionMatrix` (ts, html, css) |
| `app.routes.ts`, `layout/shell/nav.config.ts` | `/admin/permisos` carga `PermissionMatrix`; menú "Roles y permisos" |
| `resource-roles/resource-role-list/` | **Eliminado** (reemplazado) |

## Estado de la pantalla (signals)

| Signal | Uso |
|---|---|
| `roles`, `resources` | catálogos activos (`GET /roles`, `GET /recursos`, en paralelo con `forkJoin`) |
| `selectedRoleId` | rol elegido (al cargar se elige el primero) |
| `selectedResourceIds: Set<number>` | lo que se enviará al guardar |
| `savedResourceIds: Set<number>` | última matriz confirmada por el servidor |
| `loadingCatalog`, `loadingGrants`, `saving` | deshabilitan selección y guardado (`busy`) |
| `error`, `saveError`, `saveMessage` | errores de carga, errores del API al guardar y confirmación |
| `rows`, `sections` (computed) | filas agrupadas por entidad y sección (Negocio / Seguridad) |
| `pendingChanges` (computed) | cuántos IDs difieren de lo guardado |

Secuencia: roles + recursos → primer rol → `GET /concesiones-rol?role_id=` →
`Set` de IDs. Al cambiar de rol se limpian la selección y los mensajes, y se
cancela la petición anterior (`Subscription.unsubscribe`) para no pintar
concesiones viejas. Solo se envían IDs que llegaron en el catálogo.

## Agrupación y estados de casilla

`buildPermissionMatrix` aplica las reglas de ISS-CR-00: C = `POST`,
R = `GET` lista + detalle, U = `PUT` + `PATCH :id`, D = `DELETE`, y las rutas
con segmento tras `:id` van a **Acciones especiales** (una casilla por recurso,
con la descripción del backend y el método).

`grantState(ids, selected)` → `all` (marcada), `some` (`indeterminate`),
`none` (desmarcada). Marcar o desmarcar una casilla agrega o quita **todos**
los IDs que agrupa (p. ej. Leer Clientes = 2 recursos). Una celda sin recursos
muestra "No disponible" (asignaciones y concesiones no tienen U ni D).

"Marcar todo" pide confirmación porque concede también la administración de
seguridad; "Desmarcar todo" y "Descartar" solo cambian la selección local.

## Guardado

`savePermissionMatrix()`:

1. exige rol elegido, permiso `POST /api/concesiones-rol` y que no haya carga ni guardado en curso;
2. limpia el error anterior;
3. envía `{ role_id, resource_ids }` con el conjunto completo;
4. si falla, muestra el mensaje del API (`400`, `404`, `409`…) y conserva la selección;
5. si funciona, muestra `Cambios guardados. N permisos activos para este rol (+a / −d).`
   y vuelve a consultar las concesiones;
6. si el usuario editó un rol que él mismo tiene, recarga `GET /api/permisos` para
   que su menú refleje el cambio.

## Accesibilidad y seguridad visual

- Cada casilla tiene `aria-label` "operación + entidad" (p. ej. `Crear Clientes`);
  las especiales están dentro de un `<label>` con su descripción.
- Tabla semántica: `caption`, `th scope="col"`, `scope="row"` y `scope="rowgroup"`.
- Errores con `role="alert"`; éxito y contador de cambios en regiones `aria-live`.
- Sin `POST /api/concesiones-rol` la matriz queda en solo lectura (UX, no seguridad);
  la ruta sigue protegida por `permissionGuard` con `GET /api/concesiones-rol`.

## Criterios de aceptación

- [x] Cambiar rol carga la matriz correcta.
- [x] Todos, ninguno y selección parcial se muestran correctamente.
- [x] Una casilla modifica todos los recursos que agrupa.
- [x] Guardar envía `role_id` y `resource_ids`, no un mapa visual.
- [x] Fallos de red/API se presentan; no simulan éxito.
- [x] Un rol sin permisos produce una matriz desmarcada, no un error.
- [x] La pantalla no se acopla a Sequelize ni a tablas de BD.
- [x] Los controles tienen nombres accesibles.
