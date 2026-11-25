# ISS-00 · Requisitos previos — Frontend TextilClean

**Fase 0:** Preparación. **Habilita:** ISS-01.

## Objetivo

Dejar listo el entorno para construir el frontend Angular de **TextilClean —
Lavandería industrial**, que consume el backend `app-textilclean-express`.

## Herramientas

| Herramienta | Versión | Verificación |
|---|---|---|
| Node.js | `^22.22.3`, `^24.15.0` o `>=26` | `node -v` |
| npm | ≥ 10 | `npm -v` |
| Angular CLI | 22 | `npm i -g @angular/cli@22` · `ng version` |
| Backend | `app-textilclean-express` corriendo en `:4000` | `curl http://localhost:4000/api` |
| VS Code | Angular Language Service, Tailwind CSS IntelliSense | — |

## Backend de referencia

```bash
cd ../app-textilclean-express
npm run dev        # http://localhost:4000/api  ·  Swagger: /api/docs
npm run db:seed    # datos de prueba + usuarios admin / operador
```

Para trabajar la **Fase I** (ISS-03 a ISS-07) sin sesión, el backend se arranca con
`AUTH_ENABLED=false`; desde ISS-08 se vuelve a `true` y el frontend hace login.

## Dominio que verá la UI

| Pantalla | Endpoint | Tabla |
|---|---|---|
| Clientes (empresas) | `/api/clientes` | `customers` |
| Tipos de prenda | `/api/tipos-prenda` | `garment_types` |
| Servicios | `/api/servicios` | `laundry_services` |
| Órdenes de servicio | `/api/ordenes` | `service_orders` |
| Detalle de órdenes | `/api/detalle-ordenes` | `service_order_items` |
| Seguridad | `/api/usuarios`, `/api/roles`, `/api/recursos`, `/api/asignaciones-rol`, `/api/concesiones-rol` | RBAC |

## Criterios de aceptación

- [ ] Node, npm y Angular CLI 22 instalados
- [ ] Backend arriba en `http://localhost:4000` con datos semilla
- [ ] Mapa de pantallas ↔ endpoints documentado (este archivo)
