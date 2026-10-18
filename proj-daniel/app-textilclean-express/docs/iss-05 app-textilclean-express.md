# 🛠 ISS-05 · Swagger / OpenAPI — app-textilclean-express

**Proyecto:** app-textilclean-express — Express 5 + TypeScript + Sequelize, arquitectura por features.
**Fase I:** Business (sin auth ni roles).
**Feature / tabla:** `clients` (swagger)
**API:** `/api/docs`, `/api/docs.json`
**Bloqueado por:** ISS-03 — Feature Client (CRUD por capas), en concreto ISS-03-E.
**Habilita:** ISS-06 — Feature ProductType.

**Objetivo:** documentar el API del feature Client en OpenAPI 3 y montar Swagger UI desde un registry externo (mismo patrón que seeders).

---

## Criterios de aceptación (ISS-05)

- [ ] 10.1 Existe `features/business/clients/clients.swagger.ts` con tags, paths y schemas de Client
- [ ] 10.2 Existe `src/swagger/index.ts` que agrega módulos de features y monta UI
- [ ] App llama `setupSwagger` (método `docs()`)
- [ ] `GET /api/docs` muestra Swagger UI
- [ ] `GET /api/docs.json` devuelve el documento OpenAPI

**Diseño:**

| Pieza | Ubicación | Rol |
|---|---|---|
| Docs del feature | `src/features/business/clients/clients.swagger.ts` | Paths + schemas `Client` |
| Registry | `src/swagger/index.ts` | Fusiona features + `setupSwagger(app)` |
| UI | `/api/docs` | Swagger UI |
| Spec | `/api/docs.json` | OpenAPI JSON |

---

## 10.1 OpenAPI dentro del feature Client

Instala `swagger-ui-express` y sus tipos.

```bash
npm install swagger-ui-express@^5.0.1
npm install -D @types/swagger-ui-express@^4.1.8
```

> **NOTA:** la versión original del material importa
> `../../../shared/http/swagger-security` (con `bearerSecurity`,
> `unauthorizedResponse`, `forbiddenResponse`) porque Fase II añade JWT + RBAC.
> En **Fase I este lab es SIN AUTH**, así que ese archivo no existe todavía.
> La versión de abajo ya está adaptada a Fase I **SIN AUTH**.

Crea el archivo `clients.swagger.ts` con la documentación OpenAPI del feature.

```bash
: > src/features/business/clients/clients.swagger.ts
cat >> src/features/business/clients/clients.swagger.ts << 'EOF'
/**
 * Documentación OpenAPI del feature Client.
 *
 * Se agrega desde `src/swagger` (registry externo), no se monta aquí.
 * Leyenda: Fase I Business — **SIN AUTH** (no JWT, no RBAC).
 */

export const clientsSwagger = {
  tags: [
    {
      name: "Clientes",
      description: "CRUD de clientes — **SIN AUTH** (Fase I Business)",
    },
  ],
  paths: {
    "/api/clientes": {
      get: {
        tags: ["Clientes"],
        summary: "Listar clientes activos",
        description: "Retorna clientes con status=active (sin password)",
        responses: {
          "200": {
            description: "Lista de clientes",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    clients: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Client" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Clientes"],
        summary: "Crear cliente",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ClientCreate" },
            },
          },
        },
        responses: {
          "201": {
            description: "Cliente creado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    client: { $ref: "#/components/schemas/Client" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/clientes/{id}": {
      get: {
        tags: ["Clientes"],
        summary: "Obtener cliente por id",
        description: "404 si no existe o tiene borrado lógico",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "id numérico (> 0). Si no lo es, la API responde 400.",
            schema: { type: "integer", minimum: 1 },
          },
        ],
        responses: {
          "200": {
            description: "Cliente encontrado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    client: { $ref: "#/components/schemas/Client" },
                  },
                },
              },
            },
          },
          "400": { description: "id inválido (debe ser un entero positivo)" },
          "404": { description: "No encontrado" },
        },
      },
      put: {
        tags: ["Clientes"],
        summary: "Actualizar cliente (PUT — reemplazo)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "id numérico (> 0). Si no lo es, la API responde 400.",
            schema: { type: "integer", minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ClientUpdate" },
            },
          },
        },
        responses: {
          "200": { description: "Actualizado" },
          "400": { description: "id inválido (debe ser un entero positivo)" },
          "404": { description: "No encontrado" },
        },
      },
      patch: {
        tags: ["Clientes"],
        summary: "Actualizar cliente (PATCH — parcial)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "id numérico (> 0). Si no lo es, la API responde 400.",
            schema: { type: "integer", minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ClientPatch" },
            },
          },
        },
        responses: {
          "200": { description: "Actualizado" },
          "400": { description: "id inválido (debe ser un entero positivo)" },
          "404": { description: "No encontrado" },
        },
      },
      delete: {
        tags: ["Clientes"],
        summary: "Eliminar cliente (físico)",
        description: "Borra la fila (también si tiene borrado lógico)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "id numérico (> 0). Si no lo es, la API responde 400.",
            schema: { type: "integer", minimum: 1 },
          },
        ],
        responses: {
          "200": { description: "Eliminado" },
          "400": { description: "id inválido (debe ser un entero positivo)" },
          "404": { description: "No encontrado" },
        },
      },
    },
    "/api/clientes/{id}/deactivate": {
      patch: {
        tags: ["Clientes"],
        summary: "Eliminar cliente (lógico)",
        description: "status = inactive",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "id numérico (> 0). Si no lo es, la API responde 400.",
            schema: { type: "integer", minimum: 1 },
          },
        ],
        responses: {
          "200": { description: "Desactivado" },
          "400": { description: "id inválido (debe ser un entero positivo)" },
          "404": { description: "No encontrado" },
        },
      },
    },
  },
  components: {
    schemas: {
      Client: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Ana Pérez" },
          address: { type: "string", example: "Calle 10 #20-30" },
          phone: { type: "string", example: "3001234567" },
          email: { type: "string", format: "email", example: "ana@example.com" },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ClientCreate: {
        type: "object",
        required: ["name", "phone", "email", "password"],
        properties: {
          name: { type: "string" },
          address: { type: "string" },
          phone: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
          status: { type: "string", enum: ["active", "inactive"], default: "active" },
        },
      },
      ClientUpdate: {
        type: "object",
        required: ["name", "phone", "email"],
        properties: {
          name: { type: "string" },
          address: { type: "string" },
          phone: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
        },
      },
      ClientPatch: {
        type: "object",
        properties: {
          name: { type: "string" },
          address: { type: "string" },
          phone: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
        },
      },
    },
  },
};
EOF
```

---

## 10.2 Registry externo + montaje en Config

Crea la carpeta `src/swagger/` y el registry `index.ts`.

```bash
mkdir -p src/swagger
```

```bash
: > src/swagger/index.ts
cat >> src/swagger/index.ts << 'EOF'
import { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { clientsSwagger } from "../features/business/clients/clients.swagger";

export type FeatureSwaggerModule = {
  tags: unknown[];
  paths: Record<string, unknown>;
  components?: { schemas?: Record<string, unknown> };
};

/**
 * Registry externo: importa la documentación OpenAPI de cada feature
 * (mismo patrón que SeedersRunner).
 */
const featureSwaggerModules: FeatureSwaggerModule[] = [
  clientsSwagger,
  // productsSwagger,
  // userSwagger,
];

export function buildOpenApiDocument() {
  const tags: unknown[] = [];
  const paths: Record<string, unknown> = {};
  const schemas: Record<string, unknown> = {};

  for (const mod of featureSwaggerModules) {
    tags.push(...mod.tags);
    Object.assign(paths, mod.paths);
    if (mod.components?.schemas) {
      Object.assign(schemas, mod.components.schemas);
    }
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "TextilClean API",
      version: "1.0.0",
      description:
        "API TextilClean (Express + Sequelize). Fase I Business — **SIN AUTH**.",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
        description: "Local",
      },
    ],
    tags,
    paths,
    components: { schemas },
  };
}

/** Monta Swagger UI y el JSON OpenAPI */
export function setupSwagger(app: Application): void {
  const document = buildOpenApiDocument();
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(document));
  app.get("/api/docs.json", (_req, res) => {
    res.json(document);
  });
  console.log("📘 Swagger UI: /api/docs  |  OpenAPI JSON: /api/docs.json");
}
EOF
```

---

## PARCHE — `src/config/index.ts`

Este PARCHE es **importante** porque tu `config/index.ts` (el que arreglamos) **no tiene** los imports ni el método `docs()`. Hay que **volver a añadirlos** ahora que `src/swagger/index.ts` ya existe.

Abre:

```bash
code src/config/index.ts
```

### 1. Añadir el import (después de `import { Routes } ...`)

```typescript
import { setupSwagger } from "../swagger/index";
```

### 2. En el constructor, después de `this.routes();`, añadir:

```typescript
    this.docs();
```

### 3. Debajo del método `routes()`, añadir el método `docs()`:

```typescript
  private docs(): void {
    setupSwagger(this.app);
  }
```

### 📄 Resultado final del `config/index.ts`

Si prefieres reemplazar todo el archivo por la versión ya corregida, aquí lo tienes:

```typescript
import dotenv from "dotenv";
import express, { Application, ErrorRequestHandler } from "express";
import morgan from "morgan";
var cors = require("cors");
import { sequelize, getDatabaseInfo, testConnection } from "../database/db";
import "../features/business/clients/client.model";
import { Routes } from "../routes/index";
import { setupSwagger } from "../swagger/index";

dotenv.config();

export class App {
  public app: Application;
  public routePrv: Routes = new Routes();

  constructor(private port?: number | string) {
    this.app = express();
    this.settings();
    this.middlewares();
    this.routes();
    this.docs();
    this.errorHandling();
  }

  private settings(): void {
    this.app.set('port', this.port || process.env.PORT || 4000);
  }

  private middlewares(): void {
    this.app.use(morgan('dev'));
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
  }

  private routes(): void {
    this.routePrv.clientsRoutes.routes(this.app);
  }

  private docs(): void {
    setupSwagger(this.app);
  }

  private errorHandling(): void {
    const bodyErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
      if (err instanceof SyntaxError && "body" in err) {
        res.status(400).json({ error: "Malformed JSON body" });
        return;
      }
      next(err);
    };
    this.app.use(bodyErrorHandler);
  }

  private async dbConnection(): Promise<void> {
    try {
      const dbInfo = getDatabaseInfo();
      console.log(`🔗 Intentando conectar a: ${dbInfo.engine.toUpperCase()}`);

      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error(`No se pudo conectar a la base de datos ${dbInfo.engine.toUpperCase()}`);
      }

      const force = process.env.DB_SYNC_FORCE === "true";
      const isMysql =
        sequelize.getDialect() === "mysql" || sequelize.getDialect() === "mariadb";

      if (isMysql) {
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
      }
      try {
        await sequelize.sync({ force, alter: !force });
      } finally {
        if (isMysql) {
          await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
        }
      }

      console.log(
        force
          ? "📦 Base de datos recreada (DB_SYNC_FORCE=true)"
          : "📦 Base de datos sincronizada exitosamente"
      );
    } catch (error) {
      console.error("❌ Error al conectar con la base de datos:", error);
      process.exit(1);
    }
  }

  async listen() {
    await this.dbConnection();
    await this.app.listen(this.app.get('port'));
    console.log(`🚀 Servidor ejecutándose en puerto ${this.app.get('port')}`);
  }
}
```

---

## Verificación ISS-05

Arranca el servidor:

```bash
npm run dev
```

En otra terminal, comprueba que el JSON OpenAPI responde:

```bash
curl -s http://localhost:3000/api/docs.json | head -c 300
```

Y abre en el navegador:

```
http://localhost:3000/api/docs
```

Debes ver la **Swagger UI** con el tag **Clientes** y las 6 operaciones (GET ALL, GET ONE, POST, PUT, PATCH, DELETE + deactivate).

Detén el servidor con `Ctrl+C` antes de continuar.

### Al agregar otra entidad (patrón)

1. Archivo nuevo `features/.../<plural>.swagger.ts` con `: >` + `cat >>`.
2. PARCHE `src/swagger/index.ts`: debajo de `import { clientsSwagger } ...`, añadir el import; dentro de `featureSwaggerModules`, debajo de `clientsSwagger,`, añadir el módulo nuevo.

---

## Cierre del ISS

```bash
npm run dev
```

El servidor debe arrancar sin error. Abrir `http://localhost:3000/api/docs`. Detenerlo con `Ctrl+C` antes de continuar.

---

## ✅ GATE de la unidad ISS-05

Las condiciones de cierre son exactamente las que define el ISS técnico de esta misma página:

- 📋 Criterios de aceptación → **Criterios de aceptación**
- 🧩 Cierre de la unidad → **Cierre del ISS**
- 🧠 Autoevaluación → Evaluación del cuaderno

Con el GATE en verde queda habilitado **ISS-06 · Feature ProductType**.

---

**Navegación de la ruta:** ← ISS-05 · 🧠 Aprender · ↑ Ruta Express · → ISS-06 · 🧠 Aprender