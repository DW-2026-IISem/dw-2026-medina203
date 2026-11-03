# Resumen del trabajo · ISS-04 a ISS-11 (frontend TextilClean Express)

**Fecha:** 03-nov-2026
**Rama:** `claude/frontend-docs-issues-4-11-ar4mcv`
**Carpeta:** `proj-daniel/frontend-2026`
**Resultado final:** build sin errores (582 kB iniciales, sin avisos de presupuesto) ·
**137/137 pruebas** · Prettier limpio · checklist de humo **15/15** · 65 capturas reales

Este documento resume todo lo que se hizo. El detalle de cada ISS (comandos,
salidas, capturas y diferencias con la guía) está en su registro:
[04](iss-04-verificacion.md) · [05](iss-05-verificacion.md) ·
[06](iss-06-verificacion.md) · [07](iss-07-verificacion.md) ·
[08](iss-08-verificacion.md) · [09](iss-09-verificacion.md) ·
[10](iss-10-verificacion.md) · [11](iss-11-verificacion.md).

---

## 1. Cómo se trabajó

1. **Preparación.** `npm ci` en `frontend-2026`. Se comprobó el estado de
   ISS-03 antes de empezar: **no compilaba** (ver §3).
2. **Backend real.** Se levantó `app-textilclean-express` en `:3000` con
   **PostgreSQL 16** local (`DB_ENGINE=postgres`, BD `textilclean`) y se ejecutó
   su seeder (10 clientes, 25 tipos, 15 productos, 10 ventas, usuarios `admin`
   y `seller`, 58 recursos RBAC). El `.env` del backend está en `.gitignore` y
   **no** se subió.
3. **Por cada ISS:**
   - se extrajeron los bloques `cat > archivo <<'EOF'` de la guía;
   - **no** se sobrescribieron archivos de ISS anteriores cuando la guía los
     reemplazaba por versiones menos fieles al backend (modelos, entornos,
     `Shell`); se añadió solo lo que faltaba;
   - se compiló (`ng build`) y se ejecutaron las pruebas (`ng test`);
   - se corrigieron los errores de la guía y del código;
   - se hizo la **comprobación funcional en un navegador real** (Chromium
     headless con Playwright) contra el backend y la base de datos;
   - se escribió `docs/iss-NN-verificacion.md` y se hizo **un commit por ISS**.
4. **Capturas.** Todas salen del navegador, nunca del chat:
   `docs/imagenes/iss-NN-XX-descripcion.png`.

> **Fase I y autenticación.** Este backend **no** tiene la bandera
> `AUTH_ENABLED`: siempre exige token. Para las capturas de ISS-04 a ISS-07
> (todavía sin login en la app) el script de capturas añadía el token de
> `admin`; el código del frontend no se tocó para eso. Desde ISS-08 la propia
> app hace login y envía el `Bearer`.

---

## 2. Qué se construyó en cada ISS

| ISS | Qué se construyó                                                                                                  | Pruebas | Capturas |
| --- | ----------------------------------------------------------------------------------------------------------------- | ------- | -------- |
| 04  | CRUD de **tipos de producto**: servicio, formulario, lista con filtro, ruta `/tipos-producto` y menú              | 63      | 8        |
| 05  | CRUD de **productos** con relación a tipos (`p-select` con `optionValue="id"`), stock bajo con `computed`         | 86      | 6        |
| 06  | **Ventas transaccionales**: borrador con totales reactivos, validación de stock, `POST /api/ventas`, listado      | 100     | 5        |
| 07  | **Detalle de ventas**, `SaleDetail`, **dashboard** con 4 peticiones en paralelo; cierre de Fase I                 | 115     | 6        |
| 08  | **Sesión JWT**: `SessionStore`, `AuthService`, interceptor con refresh único, login, perfil, logout               | 123     | 7        |
| 09  | **Guards** (`auth`, `guest`, `permission`, `authOnly`), directiva `*appHasPermission`, menú filtrado por permisos | 130     | 9        |
| 10  | **Administración RBAC**: usuarios, roles, recursos, asignaciones usuario↔rol y concesiones rol↔recurso            | 136     | 11       |
| 11  | Calidad y cierre: `vitest-base.config.mts`, Prettier, accesibilidad, checklist de humo, publicación SPA           | 137     | 13       |

### Comprobaciones funcionales destacadas

- **Ventas:** el stock baja al confirmar (30 → 27), **no** al añadir líneas al
  borrador; con stock insuficiente el backend hace **rollback** (no se crea
  venta, ni línea, ni se descuenta nada).
- **Dashboard:** los KPIs coinciden exactamente con PostgreSQL.
- **Sesión:** 4 peticiones con token caducado → **un solo** `POST /sesion/refresh`
  → 4 reintentos. Rotación del refresh, _reuse detection_ y logout
  idempotente verificados con `curl`.
- **RBAC:** admin ve todo; seller ve un menú reducido y `/forbidden` en las
  pantallas sin permiso. Conceder un permiso hace aparecer la pantalla, y
  revocarlo + «Actualizar permisos» la quita del menú **sin recargar**.
- **Publicación:** el `dist/` servido con fallback SPA recarga bien rutas
  profundas (`/admin/usuarios`, `/ventas/nueva`).

---

## 3. Errores encontrados y cómo se corrigieron

### Heredados de ISS-03 (el proyecto no compilaba)

| Problema                                                                                        | Corrección                                                                             |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `shell.ts` reemplazado por la versión corta de la guía, incompatible con `shell.html` de ISS-02 | se restauró el `Shell` de ISS-02 (colapso en escritorio, Drawer, Toast, ConfirmDialog) |
| `ClientApi` exigía `password` al crear                                                          | usa `ClientPayload` (la guía crea clientes sin contraseña)                             |
| Pruebas con `spyOn` de Jasmine; el runner es **Vitest**                                         | `vi.spyOn(...).mockImplementation(...)`                                                |
| Specs con URL relativa `/api/clientes`                                                          | `${environment.apiUrl}/clientes`                                                       |
| **Columna «Acciones» vacía** en todas las tablas                                                | en PrimeNG 22 `pButton` ya no pinta `icon="…"`: se usa `<i pButtonIcon class="pi …">`  |

### En el código de las guías

| ISS   | Problema                                                                                                                  | Corrección                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 05    | prueba de error de `forkJoin` respondía a una petición ya cancelada                                                       | la prueba comprueba la cancelación                                                                             |
| 06    | `p-card` sin `CardModule`; fecha leída de `created_at` (el backend envía `sale_date`); `items` que el backend no devuelve | import añadido, `sale_date`, `items?` opcional                                                                 |
| 06    | error oculto de navegación en pruebas (`NG04002`) que dejaba el exit en 1 con todo verde                                  | ruta `ventas` en `provideRouter` del spec                                                                      |
| 07    | el detalle de una venta salía vacío (la venta no trae sus líneas)                                                         | `openDetail()` las pide a `/detalle-ventas` y filtra por `sale_id`                                             |
| 07    | `to-number.ts` importaba `Money` de un archivo que no lo exporta                                                          | import desde `api.model`                                                                                       |
| 08    | `profile.html` usaba `first_name`, campo inexistente                                                                      | se muestra `avatar`                                                                                            |
| 09    | el `Shell` de la guía usaba entradas inexistentes en Header/Aside y perdía el layout                                      | se integró `navGroups` sobre el layout existente; Header con menú de usuario, Aside con grupos y pie de sesión |
| 09/11 | **pantallas vacías para seller** (dashboard, productos, ventas): un 403 de un catálogo auxiliar tumbaba el `forkJoin`     | solo se piden las fuentes que el rol puede leer                                                                |
| 10    | `</ng-table>` en vez de `</p-table>`; `ngModel` sin `FormsModule`                                                         | corregido                                                                                                      |
| 10    | **`user-list` sin importar `HasPermission`**: el admin no veía «Nuevo usuario» ni las acciones (la build no lo detecta)   | import + comprobación global en el registro de ISS-10                                                          |
| 10    | editar un usuario **borraba su avatar**                                                                                   | el formulario carga el avatar actual                                                                           |
| 11    | al revocar el refresh se volvía al login **sin explicación**                                                              | el login muestra «Tu sesión expiró o fue cerrada»                                                              |
| 11    | botones de icono sin `pTooltip`; selects sin etiqueta asociada                                                            | `pTooltip` e `inputId` añadidos                                                                                |

### Pruebas añadidas (la guía no las traía)

`session-store.spec`, `auth-interceptor.spec` (refresh único), `guards.spec`,
`has-permission.spec`, `user-form.spec`, `resource-form.spec`, `role-form.spec`,
y casos nuevos en `dashboard`, `product-list` y `sale-list` para el rol SELLER.

---

## 4. Límites conocidos (no se modificó el backend)

- **Cancelar/editar/eliminar ventas y escribir en el detalle** devuelven `403`
  incluso para `admin`: el catálogo RBAC del backend no concede esos recursos.
  La interfaz ya no muestra esos botones (como pide ISS-09).
- **Emular la Fase I sin autenticación no es posible**: el backend no tiene
  `AUTH_ENABLED`.
- El backend **acepta productos con `price: 0`**, aunque la guía dice que exige
  precio mayor que 0. El formulario sí lo impide.
- Datos de prueba creados en la BD local durante la verificación: cliente
  «Lavandería Humo», tipos «Lácteos…»/«Humo editado» (inactivos), ventas 11, 13
  y 14, roles `AUDITOR` y `REPORTES`, recurso `GET /api/reportes` y el rol
  `REPORTES` asignado a `seller`.

---

## 5. Cómo reproducirlo

```bash
cd proj-daniel/frontend-2026
npm ci
npm test -- --watch=false     # 30 archivos, 137 pruebas
npm run build                 # 0 errores
npx prettier --check "src/**/*.{ts,html,css}"
npm start                     # http://localhost:4200 (backend en :3000)
```

Credenciales del seeder: `admin / Admin123!` y `seller / Seller123!`.

---

## 6. Commits

| Commit  | Contenido                                      |
| ------- | ---------------------------------------------- |
| ISS-04  | tipos de producto + correcciones de ISS-03     |
| ISS-05  | productos                                      |
| ISS-06  | ventas transaccionales                         |
| ISS-07  | detalle de ventas, dashboard, cierre de Fase I |
| ISS-08  | autenticación JWT                              |
| ISS-09  | guards, directiva y menú RBAC                  |
| ISS-10  | administración RBAC                            |
| ISS-11  | build, calidad, humo y publicación             |
| Resumen | este documento                                 |
