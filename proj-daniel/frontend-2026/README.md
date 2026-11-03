# front-textilclean-express

Frontend de **TextilClean Express** — Angular 22 (standalone + zoneless + signals),
PrimeNG 22 en modo *styled* con tema Aura y Tailwind CSS 4.

- Carpeta del proyecto: `frontend-2026`
- Backend de referencia: `app-textilclean-express` (Express 5 + TypeScript + Sequelize)
- API: `http://localhost:3000`
- App: `http://localhost:4200`

## Requisitos

- Node `^22.22.3 || ^24.15.0 || >=26.0.0`
- npm `>= 8`
- Angular CLI 22 (`npm install -g @angular/cli`)

## Comandos

```bash
npm ci          # instalar dependencias
npm start       # servidor de desarrollo en http://localhost:4200
npm run build   # build de producción en dist/
npm test        # pruebas unitarias (vitest + jsdom)
```

## Estructura

```
src/
├── app/
│   ├── app.ts            componente raíz (App)
│   ├── app.html          compone <app-ejemplo />
│   ├── app.css           vacío a propósito
│   ├── app.config.ts     providers globales (router, PrimeNG/Aura)
│   ├── app.routes.ts     rutas vacías hasta ISS-01B
│   └── demo/ejemplo/     componente de ejemplo: signal → computed → effect
├── environments/         environment.ts y environment.development.ts
├── index.html            documento único
├── main.ts               bootstrapApplication(App, appConfig)
└── styles.css            capas + Tailwind + primeicons
```

## Documentación

- [docs/proceso.md](docs/proceso.md) — pasos del ISS-00 (preparación del entorno).
- [docs/iss-00-verificacion.md](docs/iss-00-verificacion.md) — resultados de ISS-00.
- [docs/iss-01-verificacion.md](docs/iss-01-verificacion.md) — resultados de ISS-01.

## Validaciones

1. `npm run build` termina con código `0` y sin errores de presupuesto.
2. `npm test` ejecuta las pruebas de `App` y `Ejemplo` sin fallos.

## Licencia de PrimeNG 22

`providePrimeNG` lee `environment.primeUiLicense`. Sin clave, la consola muestra
`[PrimeUI] No license key configured` y una banda `Invalid PrimeUI License`: es un
**aviso de licencia**, no un error de código. La clave Community se pega en
`src/environments/environment.ts` y `environment.development.ts`.
