# ISS-05 · Swagger / OpenAPI — TextilClean

**Bloqueado por:** ISS-04. **Habilita:** ISS-06.

## Objetivo

Documentar la API con OpenAPI 3 y Swagger UI, con un *registry* al que cada
feature aporta su propio archivo `*.swagger.ts`.

## Comandos

```bash
npm install swagger-ui-express
npm install -D @types/swagger-ui-express
npm run dev
# http://localhost:4000/api/docs       (Swagger UI)
# http://localhost:4000/api/docs.json  (documento OpenAPI)
```

## Archivos

| Archivo | Responsabilidad |
|---|---|
| `src/swagger/index.ts` | Registry: une `tags`, `paths` y `schemas` de cada feature; monta `/api/docs` |
| `src/shared/http/swagger-common.ts` | Piezas comunes: `idParam`, respuestas 400/404/409, schema `Error` |
| `features/business/customers/customers.swagger.ts` | Documentación de `/api/clientes` |
| `src/config/index.ts` | Nuevo paso `docs()` en el arranque |

## Criterios de aceptación

- [x] `/api/docs` muestra Swagger UI con el título TextilClean API
- [x] `/api/docs.json` devuelve el documento OpenAPI 3.0.3
- [x] Customers documentado: 7 operaciones, schemas `Customer`, `CustomerCreate`, `CustomerUpdate`, `CustomerPatch`
- [x] Respuestas de error documentadas (400, 404, 409)
