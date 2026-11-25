# front-textilclean-express

Frontend de **TextilClean — Lavandería industrial** (proyecto 16, Desarrollo Web 2026-II).

Angular 22 (standalone, zoneless, signals) + PrimeNG 22 (tema Aura) + Tailwind CSS 4.
Consume el backend [`app-textilclean-express`](../app-textilclean-express) en `http://localhost:4000/api`.

## Qué hace

| Pantalla | Ruta | Quién la ve |
|---|---|---|
| Panel de la planta | `/panel` | ADMIN, OPERATOR |
| Órdenes de servicio (listado, detalle, avance de estado) | `/ordenes` | ADMIN, OPERATOR (el operario no anula ni elimina) |
| Nueva orden (borrador con líneas por kg o por prenda) | `/ordenes/nueva` | ADMIN, OPERATOR |
| Detalle de órdenes | `/detalle-ordenes` | ADMIN, OPERATOR |
| Clientes, tipos de prenda, servicios | `/clientes`, `/tipos-prenda`, `/servicios` | ADMIN (todo) · OPERATOR (consulta; crea clientes) |
| Seguridad: usuarios, roles, recursos, asignaciones, concesiones | `/admin/*` | ADMIN |
| Mi perfil | `/perfil` | Todos |

Usuarios de laboratorio: `admin / Admin123!` y `operador / Operador123!`.

## Comandos

```bash
npm ci               # instalar dependencias
npm start            # http://localhost:4200 (backend en :4000)
npm run build        # build de producción en dist/
npm run test:ci      # 94 pruebas unitarias (Vitest + jsdom)
npm run format       # Prettier
npm run check        # formato + build + pruebas
```

## Estructura

```
src/app/
├── core/          modelos, servicios de sesión, interceptores, guards y utilidades
├── shared/        directiva *appHasPermission, pipe cop, PageHeader, EmptyState, etiquetas de estado
├── layout/        Shell, Header, Aside, Footer y nav.config.ts (menú con permisos)
└── features/      customers, garment-types, laundry-services, service-orders,
                   service-order-items, dashboard, auth y admin
```

## Licencia de PrimeNG 22

Sin clave Community, PrimeNG muestra la banda «Invalid PrimeUI License»: es un aviso, no un
error. La clave se pega en `primeUiLicense` de `src/environments/*.ts`.

## Issues

La trazabilidad de cada issue (un commit por issue) está en [`docs/issues/`](docs/issues/).
