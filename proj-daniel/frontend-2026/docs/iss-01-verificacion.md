# ISS-01 · Bootstrap Angular 22 con CLI — Registro de verificación

**Fecha:** 01-nov-2026
**Proyecto:** `front-textilclean-express` (carpeta `frontend-2026`)
**Ruta:** `~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026`
**Estado:** ✅ Código, build, pruebas y capturas OK

---

## 1.1 · Proyecto creado en la carpeta actual

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
ng new front-textilclean-express \
  --directory . --style=tailwind --routing --ssr=false \
  --skip-git --package-manager=npm --defaults
```

Angular CLI 22.2.5. Se creó **dentro** de `frontend-2026`, sin subcarpetas, y
`docs/` se conservó.

| Archivo                 | Estado                                                |
| ----------------------- | ----------------------------------------------------- |
| `angular.json`          | ✅ en la raíz                                         |
| `package.json`          | ✅ en la raíz (`"name": "front-textilclean-express"`) |
| `src/main.ts`           | ✅                                                    |
| `src/app/app.config.ts` | ✅                                                    |
| `src/app/app.routes.ts` | ✅ (`export const routes`, `provideRouter` en config) |
| `.postcssrc.json`       | ✅ (`@tailwindcss/postcss`)                           |

**¿Por qué no `ng new .`?** El CLI valida el nombre del paquete antes de escribir:
un punto no es un nombre npm válido. La forma correcta es `ng new <nombre> --directory .`.

## 1.2 · PrimeNG compatible con Angular 22

```bash
npm view primeng version peerDependencies --json   # 22.1.4
npm install primeng @primeuix/themes primeicons @angular/cdk
npm ls primeng @primeuix/themes primeicons @angular/cdk --depth=0
```

```
front-textilclean-express@0.0.0
├── @angular/cdk@22.2.5
├── @primeuix/themes@3.1.0
├── primeicons@8.0.2
└── primeng@22.1.4
```

`primeng@22.1.4` declara peers `@angular/* ^22.1.0`, `@angular/cdk ^22.1.0` y
`rxjs ^6.0.0 || ^7.8.1`. `package-lock.json` se conserva.

## 1.3 · Estilos globales

`src/styles.css`:

```css
@layer theme, base, primeng, utilities;
@import 'tailwindcss';
@import 'primeicons/primeicons.css';
```

Sin selectores `.p-*`, sin `::ng-deep` y sin clases de aplicación.

## 1.4 · PrimeNG en `app.config.ts`

- `providePrimeNG` con `preset: Aura`.
- `darkModeSelector: '.app-dark'`.
- `cssLayer: { name: 'primeng', order: 'theme, base, primeng, utilities' }`.
- `MessageService` y `ConfirmationService` registrados.
- `provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling(...))`.
- `license: environment.primeUiLicense || undefined`.
- Se conserva `provideBrowserGlobalErrorListeners()`.
- **No** se añadió `provideHttpClient()` (ISS-02).

### Nota: entornos creados antes de tiempo

`app.config.ts` importa `environment.primeUiLicense`, así que se crearon
`src/environments/environment.ts` y `environment.development.ts` con
`primeUiLicense: ''`. En **ISS-02** se completan (URL de API, `fileReplacements`
para que `ng serve` use `environment.development.ts`).

### Licencia

Sin clave, la consola muestra `[PrimeUI] No license key configured` y la banda
`Invalid PrimeUI License`: **aviso de licencia**, no error de código.

## 1.5 · Pantalla de arranque

| Archivo                                | Estado                                          |
| -------------------------------------- | ----------------------------------------------- |
| `src/app/app.ts`                       | ✅ importa `Ejemplo` y lo declara en `imports`  |
| `src/app/app.html`                     | ✅ `<main>` con Tailwind + `<app-ejemplo />`    |
| `src/app/app.css`                      | ✅ vacío (solo un comentario)                   |
| `src/app/app.spec.ts`                  | ✅ 3 pruebas                                    |
| `src/app/app.routes.ts`                | ✅ `routes: Routes = []`                        |
| `src/app/demo/ejemplo/ejemplo.ts`      | ✅ objeto en un `signal`, `computed` y `effect` |
| `src/app/demo/ejemplo/ejemplo.html`    | ✅ dos `p-card`, botones, `p-tag`, `p-message`  |
| `src/app/demo/ejemplo/ejemplo.css`     | ✅ `.ejemplo-alcance`                           |
| `src/app/demo/ejemplo/ejemplo.spec.ts` | ✅ 4 pruebas                                    |

## 1.6 · `index.html`

- `lang="es"` ✅
- `<title>TextilClean Express · Angular 22</title>` ✅
- `<body class="m-0 bg-slate-100 font-sans text-slate-900">` ✅
- `meta description` ✅

## 1.7 · Presupuesto

`angular.json → projects → front-textilclean-express → architect → build →
configurations → production → budgets`:

```json
{ "type": "initial", "maximumWarning": "750kB", "maximumError": "1MB" }
```

## 1.8 · Primera ejecución

### Build de producción

```bash
npm run build
```

```
Initial chunk files | Names         |  Raw size
main-H4NYKSPG.js    | main          | 585.92 kB
styles-5W5JPEJJ.css | styles        |  20.48 kB
                    | Initial total | 606.40 kB
Application bundle generation complete. [17.233 seconds]
EXIT=0
```

✅ `ng build` termina con código `0`, sin warnings de presupuesto (606 kB < 750 kB).

### Pruebas unitarias

```bash
ng test --watch=false
```

```
Test Files  2 passed (2)
     Tests  7 passed (7)
```

✅ Incluye `+1000` → `19000` y «Reiniciar» → `18000`.

### Servidor de desarrollo

```bash
npm start -- --host 0.0.0.0 --port 4200
```

```
➜  Local:   http://localhost:4200/
Application bundle generation complete. [5.147 seconds]
```

```powershell
Invoke-WebRequest http://localhost:4200/
# 4200 HTTP 200  len=626
# title: TextilClean Express · Angular 22
```

✅ `http://localhost:4200` responde `200` con el `<title>` correcto.

### Comprobación visual

La captura de `http://localhost:4200` muestra el estado inicial del componente.
Las interacciones se verifican en el navegador:

| Comprobación visual | Esperado                                               |
| ------------------- | ------------------------------------------------------ |
| Estado inicial      | «Café molido 500 g», 18000, IVA 21420, etiqueta Activo |
| `+1000`             | 19000, IVA 22610, consola `[ejemplo] … precio 19000 …` |
| `-1000`             | 18000                                                  |
| Cambiar estado      | Etiqueta Inactivo + aviso de borrado lógico            |
| Campo Nombre        | «Vista previa: …» cambia con cada tecla                |
| Reiniciar           | «Café molido 500 g», 18000, Activo                     |
| Caja de estilos     | Borde discontinuo verde (`.ejemplo-alcance`)           |
| Network             | `styles.css`, `main.js` y chunks con `200`             |

### Evidencias (capturas)

| #   | Archivo                                                                                        | Bloque                        |
| --- | ---------------------------------------------------------------------------------------------- | ----------------------------- |
| 1   | [`imagenes/iss-01-01-ng-version-estructura.png`](imagenes/iss-01-01-ng-version-estructura.png) | 1.1 `ng version` + estructura |
| 2   | [`imagenes/iss-01-02-primeng.png`](imagenes/iss-01-02-primeng.png)                             | 1.2 `npm ls` de PrimeNG       |
| 3   | [`imagenes/iss-01-03-build.png`](imagenes/iss-01-03-build.png)                                 | 1.8 `npm run build`           |
| 4   | [`imagenes/iss-01-04-test.png`](imagenes/iss-01-04-test.png)                                   | 1.8 `ng test --watch=false`   |
| 5   | [`imagenes/iss-01-05-pantalla.png`](imagenes/iss-01-05-pantalla.png)                           | 1.8 app en `:4200`            |

Las capturas se tomaron de una terminal real controlada desde opencode (ventana
`Evidencias - TextilClean Express`), no del chat, y de la ventana del navegador.

---

## Incidencia del entorno: WSL dejó de aceptar sesiones nuevas

Tras el primer `ng serve` con `--host 0.0.0.0`, `wsl.exe` comenzó a devolver
`Wsl/Service/0x8007274c` (timeout) al abrir cualquier shell, aunque los puertos
`3000` y `4200` respondieron por un tiempo. El sistema anfitrión quedó con poca
memoria libre (~0,8 GB de 7,6 GB).

**Recuperación (manual, desde PowerShell de Windows):**

```powershell
wsl --shutdown
# volver a abrir la terminal WSL y luego:
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express && npm run dev
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026 && npm start
```

> `wsl --shutdown` cierra todas las distros: se pierden el backend y el `ng serve`
> en ejecución (hay que relanzarlos) y VS Code Remote-WSL se reconecta solo.

---

## Correcciones y añadidos respecto a la guía

| #   | Detalle                                                                                | Acción                                                                                           |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | La guía asume `src/environments/*` creados en ISS-02, pero `app.config.ts` los importa | se crearon mínimos con `primeUiLicense: ''`                                                      |
| 2   | `README.md` de la raíz era la plantilla del CLI                                        | reemplazado por la presentación del proyecto                                                     |
| 3   | La guía menciona `docs/construir/README.md` y `docs/README.md`                         | no existen en esta copia; el README enlaza a `docs/proceso.md` y a los registros de verificación |
| 4   | Runner de pruebas por defecto en Angular 22 es **vitest** (no Karma)                   | los `*.spec.ts` de la guía funcionan sin cambios                                                 |

---

## Cierre

- ✅ 1.1 proyecto en la raíz, sin subcarpeta.
- ✅ 1.2 PrimeNG 22.1.4 + Aura + primeicons + cdk.
- ✅ 1.3 capas y estilos globales.
- ✅ 1.4 `providePrimeNG` con Aura, `.app-dark` y `cssLayer`.
- ✅ 1.5 `App` compone `demo/ejemplo` con `signal → computed → effect`.
- ✅ 1.6 `index.html` personalizado.
- ✅ 1.7 presupuesto 750 kB / 1 MB.
- ✅ 1.8 build `0` y `4200` → `200`, con capturas de terminal y navegador.
- ⏳ 1.9 explicaciones: se completan con la lectura de este documento y el código.

Siguiente: **ISS-01A** (no requiere backend corriendo).
