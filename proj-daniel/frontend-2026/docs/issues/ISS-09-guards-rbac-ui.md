# ISS-09 · Guards y RBAC estructural en la UI — TextilClean

**Fase II · Bloque 2 de 3 (protección).** **Bloqueado por:** ISS-08. **Habilita:** ISS-10.

## Objetivo

Que cada rol vea **solo** lo que puede hacer: el operario de planta no ve botones de
borrar ni de cambiar precios; el administrador ve todo. Es UX: el backend vuelve a
validar cada petición (403).

## Guards (`core/guards`)

| Guard | Pregunta | Si falla |
|---|---|---|
| `authGuard` | ¿Hay sesión? | `/login?returnUrl=…` |
| `guestGuard` | ¿Ya hay sesión? (solo para `/login`) | `/panel` |
| `permissionGuard` | ¿El rol tiene `data.permission`? | `/forbidden?permission=…` |
| `authOnlyGuard` | ¿La auth está activa? (perfil, administración) | `/panel` |

Cada ruta declara su permiso, por ejemplo `/ordenes/nueva` → `POST /api/ordenes`.

## Directiva `*appHasPermission`

```html
<ng-container *appHasPermission="'DELETE /api/clientes/:id'"> …botón… </ng-container>
```

Aplicada a todos los botones de acción: crear, editar, desactivar y eliminar en clientes,
tipos de prenda, servicios y detalle; ver detalle, **avanzar estado**, anular y eliminar en
órdenes; «Nueva orden» en el panel.

## Menú y layout

- `nav.config.ts`: grupos **Operación** (panel, órdenes, nueva orden, detalle), **Catálogos**
  (clientes, tipos de prenda, servicios) y **Cuenta**; cada elemento con su permiso.
- `Shell.navGroups()` filtra el menú con `computed()`: cambia en vivo al recargar permisos.
- Header con rol, iniciales y menú de usuario (perfil, actualizar permisos, cerrar sesión);
  Aside con nombre, rol y número de permisos.

## Resultado verificado en navegador

| | Operario (`operador`) | Administrador (`admin`) |
|---|---|---|
| Clientes | Puede crear; sin editar ni eliminar | Todas las acciones |
| Órdenes | Ver detalle y avanzar estado; sin anular ni eliminar | Todas las acciones |
| Rutas sin permiso | Redirige a `/forbidden` o al panel | — |

## Criterios de aceptación

- [x] Cuatro guards y rutas con `data.permission`
- [x] Directiva estructural reactiva a cambios de permisos
- [x] Menú filtrado por rol y menú de usuario
- [x] Pruebas de guards, directiva y menú por rol
