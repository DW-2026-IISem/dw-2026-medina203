# ISS-10 · Administración RBAC — TextilClean

**Fase II · Bloque 3 de 3 (administración).** **Bloqueado por:** ISS-09. **Habilita:** ISS-11.

## Objetivo

Que el administrador gestione desde la UI al **personal** de la lavandería y sus
**permisos**, sin tocar la base de datos.

## Pantallas (grupo «Seguridad», solo con auth activa)

| Ruta | Componente | Qué hace |
|---|---|---|
| `/admin/usuarios` | `UserList` + `UserForm` | Usuarios con **nombre completo**, usuario y correo; crear (con contraseña), editar, desactivar, eliminar y **ver permisos efectivos** (`GET /api/usuarios/:id/permisos`) |
| `/admin/roles` | `RoleList` + `RoleForm` | ADMIN, OPERATOR y los que se creen (nombre en MAYÚSCULAS) |
| `/admin/recursos` | `ResourceList` + `ResourceForm` | Catálogo de las 69 operaciones `METHOD /ruta` de TextilClean |
| `/admin/asignaciones` | `RoleUserList` | Asignar, retirar y reactivar roles de un usuario |
| `/admin/permisos` | `ResourceRoleList` | Conceder, retirar y reactivar recursos a un rol (86 concesiones: 69 ADMIN + 17 OPERATOR) |

Cada ruta usa `authOnlyGuard` + `permissionGuard`, y cada acción `*appHasPermission`.

## Flujo típico: nuevo operario de planta

1. `/admin/usuarios` → «Nuevo usuario» (`lavador.turno1`, nombre completo, correo, contraseña).
2. `/admin/asignaciones` → asignarle el rol **OPERATOR**.
3. En «Usuarios» → «Ver permisos»: aparecen sus 17 permisos.
4. El nuevo usuario inicia sesión y solo ve operación y catálogos de consulta.

## Criterios de aceptación

- [x] CRUD de usuarios (con nombre completo), roles y recursos
- [x] Asignaciones y concesiones con retirar / reactivar
- [x] Grupo «Seguridad» del menú visible solo para quien tenga los permisos
- [x] Verificado en navegador: las 5 pantallas cargan y se crea un usuario
