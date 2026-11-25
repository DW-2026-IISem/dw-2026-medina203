# ISS-01 · Esqueleto del proyecto — TextilClean

**Bloqueado por:** ISS-00. **Habilita:** ISS-02.

## Objetivo

Proyecto npm + TypeScript + Express 5 con la estructura por features y un
servidor HTTP base.

## Comandos

```bash
npm init -y
npm install express@^5 cors dotenv morgan
npm install -D typescript@~5.9 ts-node nodemon @types/node@^22 @types/express@^5 @types/cors @types/morgan
mkdir -p src/config src/database/seeders src/routes \
         src/shared/{database,errors,http} src/features/business/customers
npx tsc --noEmit
npm run dev
```

## Estructura

```
src/
├── config/index.ts          # clase App (settings, middlewares, routes, errores)
├── database/seeders/
├── routes/index.ts          # agregador de rutas
├── shared/{database,errors,http}/
├── features/business/customers/
└── server.ts                # punto de entrada
```

## Verificación

```bash
curl http://localhost:4000/api
# {"name":"TextilClean API","status":"ok"}
```

## Criterios de aceptación

- [x] `package.json` con `"type": "commonjs"` y scripts `build` / `dev`
- [x] Árbol `src/` con `config`, `database/seeders`, `routes`, `shared`, `features/business/customers`
- [x] Dependencias Express/TS instaladas (`npm ls --depth=0`)
- [x] `tsconfig.json` con `rootDir: ./src`, `outDir: ./dist`, `strict: true`
- [x] `src/server.ts` y `src/config/index.ts` existen
- [x] `npx tsc --noEmit` sin errores
