# ISS-10 · Administración RBAC — Registro de verificación

**Fecha:** 03-nov-2026
**Proyecto:** `front-textilclean-express` (carpeta `frontend-2026`)
**Guía:** [`ISS-10 FRONTEND-TEXTILCLEAN-EXPRESS.md`](ISS-10%20FRONTEND-TEXTILCLEAN-EXPRESS.md)
**Estado:** ✅ Código, build, pruebas, cadena RBAC completa en la UI y capturas OK

> Entorno: el mismo de [ISS-04](iss-04-verificacion.md#entorno-de-esta-verificación),
> sesión real (sin inyección).

---

## 10.3 – 10.8 · Archivos

| Bloque          | Archivos                                                                 | Envoltura del backend (comprobada) |
| --------------- | ------------------------------------------------------------------------ | ---------------------------------- |
| Utilidades      | `core/utils/http-method.ts`, `core/models/admin.model.ts`                | —                                  |
| Usuarios        | `admin/users/user-api.ts`, `user-form/*`, `user-list/*`                   | `users` / `user`, `/:id/permisos` → `permissions` |
| Roles           | `admin/roles/role-api.ts`, `role-form/*`, `role-list/*`                  | `roles` / `role`                   |
| Recursos        | `admin/resources/resource-api.ts`, `resource-form/*`, `resource-list/*`  | `resources` / `resource`           |
| Asignaciones    | `admin/role-users/role-user-api.ts`, `role-user-list/*`                  | `assignments` / `assignment`       |
| Concesiones     | `admin/resource-roles/resource-role-api.ts`, `resource-role-list/*`      | `grants` / `grant`                 |

## 10.9 · Rutas y menú

- Las 5 rutas `/admin/*` se **añadieron** al `app.routes.ts` de ISS-09 (no se
  reemplazó el archivo) con `canActivate: [authOnlyGuard, permissionGuard]`.
- `nav.config.ts`: grupo **Seguridad** con Usuarios, Roles, Recursos,
  Asignaciones y Concesiones, cada uno con su `GET`.

---

## Correcciones respecto al código de la guía

| #   | Error / problema                                                                 | Corrección                                                              |
| --- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | `NG5002: Unexpected closing tag "ng-table"` (user-list.html)                      | `</ng-table>` → `</p-table>`                                            |
| 2   | `NG8002: Can't bind to 'ngModel' … 'p-select'` (resource-list.html)              | `FormsModule` en `resource-list.ts`                                     |
| 3   | **`user-list.ts` no importaba `HasPermission`**: compila, pero en runtime sale `NG0303` y **todas** las acciones envueltas quedan ocultas (el admin no veía «Nuevo usuario») | import añadido + comprobación global (abajo) |
| 4   | `UserForm` al editar reseteaba `avatar` a `''` → el PATCH enviaba `avatar: null` y **borraba** el avatar | `avatar: current?.avatar ?? ''` (cubierto por prueba)  |
| 5   | etiquetas «Usuario/Rol/Recurso» de los diálogos sin asociar a su `p-select`     | `inputId` + `for` (`ru-user`, `ru-role`, `rr-role`, `rr-resource`)      |

Comprobación global para el error 3 (la build **no** lo detecta):

```bash
for h in $(grep -rl "appHasPermission" src/app --include=*.html); do
  t=${h%.html}.ts; grep -q "HasPermission" $t || echo "FALTA: $t"
done
# (sin salida)
```

---

## Pruebas y build

| Archivo nuevo                                     | Casos | Criterio que cubre                                         |
| ------------------------------------------------- | ----- | ---------------------------------------------------------- |
| `admin/users/user-form/user-form.spec.ts`         | 3     | password y status **solo al crear**; mínimo 8; PATCH conserva avatar |
| `admin/resources/resource-form/resource-form.spec.ts` | 2 | `path` debe empezar por `/`; payload con método + ruta     |
| `admin/roles/role-form/role-form.spec.ts`         | 1     | `name` en **MAYÚSCULAS**                                   |

```
 Test Files  30 passed (30)
      Tests  136 passed (136)
TEST_EXIT=0

Initial total | 582.24 kB | 138.70 kB
BUILD_EXIT=0
```

---

## Comprobación de la cadena completa en la UI

| Paso                                                      | Resultado observado                                                                          |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| admin → `/admin/usuarios`                                 | 2 usuarios, «Nuevo usuario» y acciones visibles                                              |
| «Ver permisos» de `seller`                                | `GET /api/usuarios/2/permisos` → rol SELLER y 7 filas `(método, ruta)`                       |
| Editar `seller`                                           | diálogo con Usuario, Email y Avatar; **sin** contraseña ni estado                            |
| Roles → «Nuevo rol» `auditor`                             | `POST /api/roles` → aparece **AUDITOR**                                                      |
| Recursos                                                  | 58 recursos; contadores GET 20 · POST 9 · PUT 6 · PATCH 17 · DELETE 6                        |
| Asignar `seller` ↔ `SELLER` (ya existe)                   | `POST /api/asignaciones-rol` → **409** «Role is already assigned to this user» (toast)       |
| Concesiones → SELLER + `GET /api/tipos-producto`          | el select muestra **método + ruta**; `POST /api/concesiones-rol` OK                          |
| Login como `seller`                                       | menú con **Tipos de producto**; «SELLER · 8 permisos»; `/tipos-producto` carga               |
| admin revoca la concesión (curl, en paralelo)             | `PATCH /api/concesiones-rol/66/deactivate` → 200                                             |
| seller → menú de usuario → «Actualizar permisos»          | `GET perfil` + `GET permisos` → **Tipos de producto desaparece** del menú; «7 permisos»      |
| seller → `/admin/usuarios`                                | `/forbidden?permission=GET /api/usuarios`, 0 peticiones                                      |

---

## Evidencias (capturas)

| #   | Archivo                                                                                        | Bloque                          |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------------- |
| 1   | [`imagenes/iss-10-01-usuarios.png`](imagenes/iss-10-01-usuarios.png)                           | usuarios (tras la corrección 3) |
| 2   | [`imagenes/iss-10-02-ver-permisos-seller.png`](imagenes/iss-10-02-ver-permisos-seller.png)     | permisos efectivos de seller    |
| 3   | [`imagenes/iss-10-03-rol-mayusculas.png`](imagenes/iss-10-03-rol-mayusculas.png)               | rol AUDITOR                     |
| 4   | [`imagenes/iss-10-04-recursos.png`](imagenes/iss-10-04-recursos.png)                           | catálogo de recursos            |
| 5   | [`imagenes/iss-10-05-asignacion-duplicada.png`](imagenes/iss-10-05-asignacion-duplicada.png)   | 409 por duplicado               |
| 6   | [`imagenes/iss-10-06-conceder.png`](imagenes/iss-10-06-conceder.png)                           | conceder: método + ruta         |
| 7   | [`imagenes/iss-10-07-concedido.png`](imagenes/iss-10-07-concedido.png)                         | concesión creada                |
| 8   | [`imagenes/iss-10-08-seller-con-tipos.png`](imagenes/iss-10-08-seller-con-tipos.png)           | seller con el nuevo permiso     |
| 9   | [`imagenes/iss-10-09-seller-revocado.png`](imagenes/iss-10-09-seller-revocado.png)             | menú tras revocar + actualizar  |
| 10  | [`imagenes/iss-10-10-seller-admin-forbidden.png`](imagenes/iss-10-10-seller-admin-forbidden.png) | seller en `/admin/*`          |
| 11  | [`imagenes/iss-10-11-editar-usuario.png`](imagenes/iss-10-11-editar-usuario.png)               | edición sin password ni estado  |

---

## Cierre

- ✅ Usuarios: contraseña y estado solo al crear; «Ver permisos» con `role_name`.
- ✅ Roles en MAYÚSCULAS · Recursos con `path` validado.
- ✅ Asignaciones sin duplicados (409) · Concesiones con método + ruta.
- ✅ Un permiso revocado desaparece del menú tras «Actualizar permisos».
- ✅ `seller` no abre `/admin/*`.
- ✅ build `0` · 136/136 pruebas · 11 capturas.

Siguiente: **ISS-11 · Build, calidad y cierre**.
