# ISS-12 · Features RoleUsers y ResourceRoles — TextilClean

**Bloqueado por:** ISS-11. **Habilita:** ISS-13.

## Objetivo

Construir las dos tablas pivote del RBAC: **quién tiene qué rol** y **qué puede
hacer cada rol**. Con ellas se calculan los permisos efectivos de un usuario.

```
users ──< role_users >── roles ──< resource_roles >── resources
```

No existe una entidad `Permission`: **la fila activa de `resource_roles` es el permiso**.

## Endpoints (sin middlewares hasta ISS-13)

| Ruta | Operaciones |
|---|---|
| `/api/asignaciones-rol` | GET, GET `:id`, POST (asignar), PATCH `:id/deactivate` (retirar), PATCH `:id/reactivate` |
| `/api/concesiones-rol` | GET (`?role_id=`, `?resource_id=`), GET `:id`, POST (conceder), PATCH `:id/deactivate`, PATCH `:id/reactivate` |
| `/api/usuarios/:id/permisos` | Permisos efectivos del usuario |

## Reglas

- Asignar/conceder exige usuario, rol y recurso **activos** (404).
- Una asignación o concesión activa no se duplica (**409**); si existía inactiva, se reactiva.
- `reconcileRole(roleId, resourceIds)` deja la matriz de un rol **exactamente** igual a la
  lista: activa lo que falta y desactiva lo que sobra, en una transacción.
- Permisos efectivos = recursos activos ∩ concesiones activas ∩ roles activos ∩ asignaciones activas del usuario.

## Seeders (deterministas y reconciliadores)

Orden de seguridad: `roles → resources → users → role_users → resource_roles`.

| Resultado | Valor |
|---|---|
| Roles | 2 (ADMIN, OPERATOR) |
| Recursos | 69 |
| Usuarios canónicos | 2 (admin, operador) |
| Asignaciones | 2 |
| Concesiones | 86 (ADMIN 69 + OPERATOR 17) |

Re-ejecutar `npm run db:seed` deja la matriz exacta (`+0 / -0`).

## Criterios de aceptación

- [x] Features role-users y resource-roles con capas, Swagger y `.http`
- [x] Asignar, retirar, reactivar y `reconcileRole`
- [x] Endpoint de permisos efectivos
- [x] Seeders con los conteos indicados
