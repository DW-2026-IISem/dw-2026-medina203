# 🛠 ISS-11 · Build, calidad y cierre del proyecto

> **Proyecto frontend:** `front-textilclean-express` (carpeta real: `frontend-2026`)
> **Ruta frontend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026`
> **Proyecto backend:** `app-textilclean-express`
> **Ruta backend:** `~/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express`
> **Fase:** II · Auth + RBAC · **Bloqueado por:** ISS-10 · **Cierre del proyecto**
> **Vigencia:** revisión alineada con guía del docente del 23-oct-2026.
> **Capa:** 🛠 Construir (ejecutar, verificar y entregar)

---

## 0. Antes de tocar nada

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
pwd
```

Verifica que **ISS-10** está cerrada:

```bash
ls src/app/features/admin/         # users/  roles/  resources/  role-users/  resource-roles/
ls src/app/core/guards/            # auth  guest  permission  auth-only
ls src/app/shared/directives/      # has-permission
```

Y que el **backend** está en marcha:

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express
# .env debe tener AUTH_ENABLED=true
npm run dev
```

En otra terminal:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/clientes
# 401  → backend en Fase II (correcto)
# 200  → backend en modo laboratorio (AUTH_ENABLED=false)
```

---

## Objetivo y alcance

Dejar el frontend **reproducible y desplegable**:

1. `ng build` **sin errores ni warnings bloqueantes**.
2. Recorrer las **dos fases** y, solo para práctica, poder **emular la Fase I** con una bandera (el código de Fase I real **no tiene auth que desactivar**).
3. **Checklist funcional de humo**.
4. **Catálogo de errores reales** de Angular 22 / PrimeNG 22 y su solución.
5. **Publicación estática** con **fallback SPA**.

**Antes de construir:** comprueba primero `/construir` **sin HTTP**; después rutas de negocio **con sesión**. Ejecuta compilación y pruebas; **distingue resultado medido** de **revisión pendiente**.

**Evidencia de aprendizaje:** entrega evidencia de **escritorio, móvil, integración y permisos**. **Un build no demuestra integración con Express.**

**Equipo y terminal:** Ubuntu WSL, terminal del editor, carpeta `frontend-2026`.

---

## Criterios de aceptación (ISS-11)

- [ ] `ng build` termina con **0 errores**.
- [ ] No hay **warnings de presupuesto** que impidan el despliegue.
- [ ] Los **15 puntos** del **checklist de humo** pasan.
- [ ] Emular la Fase I con `requireAuth: false` (frontend) y `AUTH_ENABLED=false` (backend) en una copia de práctica produce el comportamiento esperado (**sin guards, directiva siempre visible, sin `Bearer` y `200` en negocio**).
- [ ] **Revocar el refresh token** cierra la sesión de forma controlada.
- [ ] `prettier --check` no reporta archivos sin formatear.
- [ ] El `dist/` se sirve con **fallback SPA** y las rutas profundas recargan bien.

---

## 11.1 Los dos entornos

Angular reemplaza `environment.ts` por `environment.development.ts` cuando sirve en modo **desarrollo** (`fileReplacements` en `angular.json`).

| Archivo | Se usa en | `requireAuth` |
|---|---|---|
| `environment.development.ts` | `ng serve` | `true` (Fase II) |
| `environment.ts` | `ng build` | `true` (Fase II) |

### Emular la Fase I sobre el código final (solo práctica)

> La **Fase I real** (ISS-03…07) **no tiene guards, directiva ni interceptor**: no hay nada que desactivar. Esta bandera solo sirve para **demostrar** en una copia de práctica cómo se comportaba el frontend **antes de ISS-09**.

**Hay dos interruptores y hay que moverlos juntos:**

| Interruptor | Dónde | Qué controla |
|---|---|---|
| `requireAuth` | `environment.ts` y `environment.development.ts` | Guards, `*appHasPermission`, menú y reintento de refresh |
| `AUTH_ENABLED` | `.env` del backend `app-textilclean-express` | `authenticate` y `authorize` de las **5 rutas de negocio** |

En **ambos archivos** del frontend, cambia:

```ts
requireAuth: false,
```

En el `.env` del backend, cambia:

```
AUTH_ENABLED=false
```

> ⚠️ Con el **backend consolidado**, `requireAuth: false` **no basta**: sin login **no hay token** y toda petición de negocio recibiría `401 Missing Bearer token`. La bandera `AUTH_ENABLED=false` **abre solo** `/api/clientes`, `/api/tipos-producto`, `/api/productos`, `/api/ventas` y `/api/detalle-ventas`; login, refresh, perfil, `/api/permisos` y las rutas de administración RBAC **siguen exigiendo JWT**.

**Con las dos banderas en `false`:**

- `authGuard` y `permissionGuard` **dejan pasar**.
- `*appHasPermission` **renderiza siempre**.
- El `authInterceptor` **no añade `Authorization`** una vez limpiada la sesión (sin token no hay cabecera ni refresh). **Si quedó un token viejo, bórralo** con el `localStorage.removeItem` de abajo.
- El **menú** muestra **Operación + Prototipo**: el grupo **Seguridad se oculta** porque el backend sigue exigiendo JWT en `/api/usuarios`, `/api/roles`, etc.
- `/perfil` y `/admin/*` **escritos a mano** redirigen a `/dashboard` (`authOnlyGuard`).
- El **tótem del Header** muestra **Fase I · sin auth**.
- El **backend** responde `200` a las rutas de negocio **sin token**.

**Reinicia `ng serve` y el backend** después de cambiar cada bandera, y **borra la sesión anterior** en DevTools:

```js
localStorage.removeItem('textilclean.session.v1');
location.reload();
```

> **Vuelve a `true` para la entrega de Fase II.** No mezcles: el backend final `app-textilclean-express` tiene **JWT + RBAC en todas las rutas de negocio**; si el frontend usa `requireAuth: false`, las peticiones llegarán **sin token** y el backend responderá **`401`**.

### Apuntar a otro backend

```ts
apiUrl: 'https://mi-api.ejemplo.com/api',
```

**Sin barra final.** Todos los servicios concatenan `environment.apiUrl + '/clientes'`.

---

## 11.2 Scripts

`npm run ng -- <comando>` invoca el **CLI local** sin depender del `PATH` global. Los ejemplos con `ng` presuponen el Angular CLI instalado en ISS-00.

**Añade al `package.json`** (si no lo tenías) estos scripts:

```bash
cat > package.json <<'EOF'
{
  "name": "front-textilclean-express",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "docs:check": "node tools/check-docs.mjs"
  }
}
EOF
```

> ⚠️ **Ojo con el `cat >` anterior:** sobrescribe `package.json`. Si ya tenía `dependencies`/`devDependencies`, **no lo uses**. En su lugar, **edita a mano** `package.json` y añade solo los scripts que falten. El bloque anterior es solo referencia.

### `vitest-base.config.mts` (límite de workers)

Sin este límite, **7 workers de Vitest sobre 8 núcleos** compartidos con `ng serve`, MySQL y el IDE provocan `Test timed out in 5000ms` en pruebas **correctas**.

```bash
cat > vitest-base.config.mts <<'EOF'
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    maxWorkers: 2,
    testTimeout: 20_000,
  },
});
EOF
```

En `angular.json`, dentro de `architect.test`:

```json
"test": {
  "builder": "@angular/build:unit-test",
  "options": { "runnerConfig": true }
}
```

> Con dos workers la suite pasa **completa**; el costo es **más tiempo de pared**.

### Comandos del laboratorio

```bash
npm ci
npm start                 # http://localhost:4200
ng build                  # producción → dist/
ng serve --port 4200 --host 0.0.0.0
npm test -- --watch=false
```

---

## 11.3 Presupuestos de bundle

`angular.json` (dentro de `projects → ... → architect → build → configurations → production → budgets`):

```json
"budgets": [
  { "type": "initial", "maximumWarning": "750kB", "maximumError": "1MB" },
  { "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" }
]
```

**PrimeNG 22 + Aura + Tailwind** superan los **500 kB** iniciales por defecto. Se subió el **warning a 750 kB**, **no** el error.

### Si quieres reducir el bundle real

- Mantén **todas** las rutas con `loadComponent` (ya están).
- Importa **solo** los módulos PrimeNG que usa **cada componente standalone**.
- **No** importes `ChartModule` ni `TableModule` en el `Shell`.
- Revisa que `providePrimeNG` **no registre componentes globales innecesarios**.

Comprueba el reparto:

```bash
ng build --stats-json
# Analiza dist/front-textilclean-express/browser/stats.json
```

---

## 11.4 Checklist funcional de humo

Ejecuta `ng serve` con el **backend arriba** y recorre los 15 puntos:

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | `/dashboard` **sin sesión** | Redirige a `/login?returnUrl=/dashboard` |
| 2 | **Login admin** | Entra al dashboard; menú completo |
| 3 | **CRUD cliente** | Crear, editar, desactivar; búsqueda filtra |
| 4 | **CRUD tipo** | Igual que clientes |
| 5 | **CRUD producto** | `Select` de tipo; precio con moneda; stock con color |
| 6 | **Nueva venta** | Añade líneas, total reactivo, **descuenta stock** |
| 7 | **Detalle ventas** | Filtra por venta; editar/eliminar línea |
| 8 | **Dashboard** | KPIs coinciden con `/api/ventas` y `/api/productos` |
| 9 | **RBAC admin** | Crear rol, recurso, asignación y permiso |
| 10 | **Ver permisos** | Muestra `permissions` con `role_name` y `(method, path)` |
| 11 | **Logout** | `POST /api/sesion/logout`; vuelve a login y **no queda token** |
| 12 | **Login seller** | Menú **reducido**; `/admin/*` → `/forbidden` |
| 13 | **Refresh del navegador** | La sesión **persiste** (`localStorage`) |
| 14 | **Token expirado** | El interceptor refresca **una vez** y reintenta |
| 15 | **Revocar refresh token** | Sesión cerrada y mensaje claro |

### Probar expiración y refresh

En **DevTools → Application → Local Storage → `textilclean.session.v1`**, copia el `refreshToken` y revócalo desde el backend:

```bash
curl -X POST http://localhost:4000/api/sesion/logout \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"PEGA_AQUI_EL_TOKEN"}'
```

Luego pulsa cualquier acción en la UI: el refresh **falla**, se **limpia la sesión** y aparece el toast de **sesión expirada**.

---

## 11.5 Errores reales y su causa

Estos errores **aparecieron durante la construcción** del proyecto. Úsalos como **tabla de diagnóstico**.

### Aviso `[PrimeUI] PrimeUI license is not configured` en la consola

**No es un error** ni rompe nada: es un `console.warn` que emite `@primeui/license-manager`, una dependencia que `primeng@22` arrastra para sus productos premium. Los componentes usados en este proyecto (`Table`, `Dialog`, `Select`, `Tag`, `Toast`, `ConfirmDialog`) son de la **edición community** y **funcionan sin licencia**.

- Si aparece **una vez al arrancar**, puedes **ignorarlo**.
- **No afecta** a `ng build` ni a los tests.
- Si quieres la consola limpia, configura la clave con `registerLicense` **solo si tienes una licencia PrimeUI válida**; **no inventes una clave** ni silencies el aviso con un parche en `node_modules` (se pierde al reinstalar).
- **No lo confundas con un fallo de la pantalla**: si la tabla no pinta, el problema está en `#header` / `#body` (ver el PARCHE de ISS-03), **no** en este aviso.

### `NG8002: Can't bind to 'text' since it isn't a known property of 'p-message'`

PrimeNG 22 **eliminó el input `text`**. Usa **proyección**:

```html
<p-message severity="error" [closable]="false">{{ error() }}</p-message>
```

### `NG8002: Can't bind to 'globalFilter' on 'p-table'`

`p-table` **ya no tiene `globalFilter`**. Filtra tú:

```ts
readonly visibleRows = computed(() =>
  filterRows(this.rows(), this.filter(), (row) => [row.name, row.email]),
);
```

```html
<p-table [value]="visibleRows()" [paginator]="true" [rows]="10">…</p-table>
```

### `NG8001: 'p-sortIcon' is not a known element`

El componente se llama **`p-sort-icon`** (kebab-case):

```html
<th pSortableColumn="name">
  Nombre <p-sort-icon field="name" />
</th>
```

### `Type 'Menu' has no call signatures`

La **referencia de plantilla** tapa al **método** del mismo nombre:

```html
<!-- mal -->
<p-menu #userMenu [model]="userMenu()"></p-menu>

<!-- bien -->
<p-menu #userMenuPanel [model]="userMenu()"></p-menu>
```

### `NG8002: Can't bind to 'value' on 'p-select'`

`p-select` usa **`ngModel`**:

```html
<p-select [fluid]="true"
  [options]="types()"
  optionLabel="name"
  [ngModel]="selected()"
  (ngModelChange)="selected.set($event)"
/>
```

Recuerda **`FormsModule`** en `imports`.

### Errores de **ruta relativa** (`../../../core` vs `../../../../core`)

Cada nivel de carpeta añade un `../`. Regla:

| Archivo | Profundidad | Import a `core/` |
|---|---|---|
| `features/clients/client-list` | 3 | `../../../core/…` |
| `features/admin/users/user-list` | 4 | `../../../../core/…` |

### `NG0303: Can't bind to 'ngModel'` / `NG8001` en un componente

**Falta el módulo** en `imports` del `standalone`. Añade `FormsModule`, `TableModule`, `ButtonModule`, etc. **Angular 22 no tiene `NgModule` contenedor** que los aporte.

### `401` **en cascada** al cargar el dashboard

El interceptor está intentando refrescar con un `refreshToken` **inválido**. Revisa:

1. El login **guardó** `accessToken` **y** `refreshToken`.
2. `localStorage` **no está bloqueado** (modo incógnito estricto).
3. El **reloj del sistema** no está desfasado respecto al backend.
4. Solo hay **un refresh en vuelo** (`refreshInFlight`).

### `403` **con menú visible**

El **menú** se calculó con un **token anterior**. Pulsa **Actualizar permisos**; si persiste, revisa `GET /api/usuarios/:id/permisos` y `GET /api/permisos`.

### El **login responde 200** pero el **dashboard sale vacío**

`POST /api/sesion/login` **solo devuelve tokens**. Si tu `AuthService` espera `user`, `roles` y `resources` en esa respuesta, la **sesión queda a medias**. El flujo correcto es:

```
login → setTokens → forkJoin(GET /api/sesion/perfil, GET /api/permisos) → setAccess
```

### El **backend responde CORS**

El backend Express debe **permitir** el origen del frontend:

```
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

En **desarrollo**, el origen **cambia** si usas otro puerto o `--host 0.0.0.0` con otra IP. Ajusta la configuración CORS del backend **o** sirve el frontend tras el **mismo origen**.

### `fatal error: all goroutines are asleep - deadlock!` al arrancar `ng serve`

El **optimizador de dependencias de Vite (esbuild)** se bloquea justo después de `Application bundle generation complete`:

```
[vite] (client) [optimizer] bundling dependencies...
fatal error: all goroutines are asleep - deadlock!
```

Pasa en **algunos entornos** con recursos limitados, **WSL2** o ejecución dentro de **sandboxes/containers**. Soluciones, **en orden**:

1. En la **terminal del servidor**, detén el proceso con `Ctrl+C` y vuelve a ejecutar `npm start`.
2. Desde la **carpeta del frontend**, limpia la caché con el CLI:

   ```bash
   ng cache clean
   ng serve
   ```

3. Si el problema está en la **precompilación de dependencias** de Vite:

   ```bash
   ng serve --prebundle=false
   ```

   `--configuration development` **por sí solo no desactiva la precompilación**; `--prebundle=false` es la opción destinada a ello. Verifica su disponibilidad con `ng serve --help` si cambias de versión del CLI.

4. Si el **puerto está ocupado**, identifica el proceso con `ss -ltnp` y cierra su terminal con `Ctrl+C`, o **elige otro puerto**: `ng serve --port 4201`. Una respuesta HTTP 200 **no demuestra** que existan dos instancias. **No uses `pkill -f`** para detener todos los servidores de los proyectos del laboratorio.

### `Test timed out in 5000ms` en pruebas que antes pasaban

**No es un fallo de lógica**: Vitest lanza un **worker por archivo de prueba** y, en un equipo de 8 núcleos con `ng serve`, MySQL y el IDE, esos workers **saturan la CPU**. **Síntoma:** varias suites **distintas** fallan **a la vez** con el **mismo mensaje** y el `Duration` del run **supera los dos minutos**.

**La solución ya está en el proyecto:** `maxWorkers: 2` y `testTimeout: 20_000` en `vitest-base.config.mts`, activado por `runnerConfig: true` en `angular.json`. Si vuelve a aparecer, **cierra `ng serve`** antes de correr la suite y **compara**.

### El build **falla por presupuesto**

```
Budget 500 kB was exceeded…
```

**Sube `maximumWarning`** en `angular.json` (ISS-11.3) **o reduce imports**. **No subas el `maximumError`** sin justificar.

---

## 11.6 Calidad de código

**Convenciones del proyecto:**

- **Signals** para estado local y derivado; **`computed`** en lugar de getters.
- **`inject()`** en lugar de constructor injection.
- Servicios con `@Injectable({ providedIn: 'root' })` y sufijo **`Api`** para HTTP.
- **Modelos en `core/models`**, sin lógica.
- **Componentes standalone**, plantilla y estilos separados.
- Para suscripciones **persistentes**, usa `takeUntilDestroyed`; las peticiones `HttpClient` **simples completan** tras su respuesta. No se presenta como una llamada ya existente en todos los `load()`.
- **Nombres de archivo en `kebab-case`**; **clases en `PascalCase`**.

**Formato:**

```bash
npm exec -- prettier --write "src/**/*.{ts,html,css}"
```

**Tipado estricto** ya está activo (`strict: true`). **Evita `any`**; usa **`unknown`** y **`toApiMessage(error)`**.

### Accesibilidad mínima

- **Todo `input`** tiene `label` o `aria-label`.
- Los **botones de icono** llevan `pTooltip` **y** `aria-label`.
- Los **colores de stock** **no son el único indicador**: se muestra el **número**.

---

## 11.7 Publicación

```bash
ng build
```

**Salida:**

```
dist/front-textilclean-express/browser/
├── index.html
├── main-XXXXXXXX.js
├── styles-XXXXXXXX.css
└── assets/…
```

Sirve la carpeta con un **servidor que haga fallback a `index.html`** (**SPA**). En **Nginx**:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Si publicas en un **subdirectorio**, añade:

```bash
ng build --base-href /textilclean/
```

Y configura `apiUrl` con el **dominio real** del backend, recordando **CORS**.

---

## Verificación del ISS

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026

# 1. Sin errores de build
ng build

# 2. Sin warnings de presupuesto bloqueantes
ng build 2>&1 | grep -i "budget" || echo "sin warnings de budget: correcto"

# 3. Prettier
npm exec -- prettier --check "src/**/*.{ts,html,css}"

# 4. Pruebas
npm test -- --watch=false

# 5. CORS del backend
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Origin: http://localhost:4200" \
  http://localhost:4000/api/clientes
# 401 → protegido (Fase II); 200 → laboratorio (AUTH_ENABLED=false)

# 6. Verifica los 5 endpoints de negocio
for path in clientes tipos-producto productos ventas detalle-ventas; do
  echo "== $path"
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:4000/api/$path"
done
```

### Comprobación de build + pruebas (medido)

```bash
npm test -- --watch=false
npm run build
```

**Resultado esperado (ejemplo de la fuente, 2026-10-23):**

| Comando | Resultado |
|---|---|
| `npm test -- --watch=false` | 22 archivos, **131 pruebas** aprobadas |
| `npm run build` | **0 errores**; inicial **576.65 kB** (warning en 750 kB) |
| `npx prettier --check "src/**/*.{ts,html,css}"` | **Todos** los archivos formateados |
| `/dashboard` sin sesión | Redirige a `/login?returnUrl=%2Fdashboard` |
| `/construir` | Renderiza con **datos locales**, sin solicitudes `/api` |
| Backend `AUTH_ENABLED=false` (negocio) | **`200`** en las 5 rutas; **`201`** en `POST /api/clientes` **sin token** |
| Backend `AUTH_ENABLED=false` (auth) | **`401`** en `/api/usuarios`, `/api/sesion/perfil`, `/api/permisos` |
| `GET /api/productos-falsos` con `AUTH_ENABLED=false` | **`401`**: el prefijo **no** se abre por accidente |

### Pendiente de revisión manual

Los **puntos 2–15** del **checklist de humo** exigen el **backend Express arriba con MySQL**. Sin él **no se puede medir** login real, RBAC contra la API, descuento de stock ni rotación/revocación del refresh token. **No se marca como verificado** lo que solo está cubierto por pruebas con **HTTP simulado**.

---

## Cierre del recorrido

Has construido, con **CLI y signals**, las **dos fases** del backend:

```
Fase 0 · Fundamentos
ISS-00  Entorno validado
ISS-01  Angular 22 + Tailwind 4 + PrimeNG 22
ISS-02  Core, modelos y layout (sin sesión todavía)

Fase I · Business CRUD (sin auth)
ISS-03  Clientes
ISS-04  Tipos de producto
ISS-05  Productos + stock
ISS-06  Ventas transaccionales
ISS-07  Detalle + dashboard · CIERRE FASE I

Fase II · Auth con RBAC
ISS-08  Formulario de sesión, JWT, perfil y permisos efectivos (bloque 1)
ISS-09  Guards + RBAC de las pantallas business (bloque 2)
ISS-10  Formularios de usuarios, roles, recursos y pivotes (bloque 3)
ISS-11  Build, calidad y cierre del proyecto
```

### Checklist de cierre por fase

**Fase I:**

- [x] Los **5 CRUD de negocio** están implementados con el contrato del backend.
- [ ] Los 5 CRUD funcionan contra un backend **sin middlewares** (requiere backend).
- [x] **No queda ninguna pieza de auth** sin conexión: guards, directiva e interceptor **solo se activan en Fase II**.
- [x] **Tests y build pasan**.

**Fase II:**

- [x] El login es **obligatorio** y el refresh **rota el token una sola vez** (`refreshInFlight` con `shareReplay`).
- [x] Cada ruta de negocio tiene **`permissionGuard`** y su **`data.permission`**.
- [x] Cada botón de escritura está **envuelto en `*appHasPermission`**.
- [x] La **matriz efectiva** filtra el **menú** y las **acciones**; los **guards** cubren la **navegación directa**. La comprobación con backend real **queda pendiente**.
- [x] Los **5 formularios auth** permiten administrar la cadena `User → Role → Resource`.

---

## Solución de último recurso

Si algo **no compila** y no encuentras la causa:

```bash
rm -rf node_modules .angular dist
npm ci
ng build
```

Y revisa la **consola del navegador** con `ng serve` **en primer plano**: los **errores de plantilla** de Angular 22 indican el **archivo y la línea exactos**.

---

## Verificación del primer esqueleto (recordatorio)

Con **backend detenido**, abre `/construir`: **Header, Aside, contenido y Footer** deben aparecer. Pulsa una opción en **escritorio y móvil**, verifica **Drawer** y **ausencia de solicitudes `/api`**. Ejecuta `npm test -- --watch=false`: la prueba del CLI que esperaba “Hello” fue **reemplazada** por pruebas de esta ruta y su menú.

---

## Correspondencia con el código

Archivos que **crea o reemplaza** este ISS:

- `vitest-base.config.mts` *(nuevo, si no existía)*
- `package.json` *(edita: añade scripts `ng`, `docs:check` si no existían; **no sobrescribas** si ya tenía dependencias)*
- `angular.json` *(edita: `runnerConfig: true` en `test`; presupuestos ya ajustados en ISS-01)*

Archivos de **ISS-02 → ISS-10 que no se tocan**: todo `src/` funcional.

---

## Notas del docente

- **Un build no demuestra integración.** El `ng build` compila **tipos**, no prueba **HTTP**, **stock** ni **RBAC** contra el backend real. **No marques como verificado** lo que solo está cubierto por pruebas con **HTTP simulado**.
- **Los dos interruptores** (`requireAuth` + `AUTH_ENABLED`) se mueven **juntos**. Con **uno solo**, la UI no se bloquea pero la API responde `401`.
- **El aviso `PrimeUI license is not configured` es `warn`**, no error. **No** afecta a `ng build` ni a los tests.
- **`refreshInFlight`** debe ser una **variable de módulo** con `??=` (no `=`). Si ves **dos refresh** en Network, el **single-flight está roto**.
- **`vitest-base.config.mts`** limita los **workers** a `2` y sube el `testTimeout` a `20_000`. Sin eso, la suite falla con `Test timed out in 5000ms` **sin ser un fallo de lógica**.
- **Fallback SPA** en el servidor estático: `try_files $uri $uri/ /index.html`. Sin él, las **rutas profundas** (`/clientes`, `/admin/usuarios`) devuelven **404** al recargar.
- **`prettier --check`** debe pasar **antes** de la entrega. Si falla, `prettier --write` **y luego** `--check` de nuevo.

---

## Navegación

⬅️ **Anterior:** ISS-10 — Administración RBAC: usuarios, roles, recursos y pivotes
⬆️ **Ruta:** Frontend-Express · **Fase II · Cierre del proyecto**
➡️ **Siguiente:** ↑ Ruta Frontend-Express (fin del recorrido)