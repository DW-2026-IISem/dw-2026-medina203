# 🛠 ISS-03 · Feature Client (CRUD por capas) — app-textilclean-express

**Proyecto:** app-textilclean-express — Express 5 + TypeScript + Sequelize, arquitectura por features.
**Fase I:** Business (sin auth ni roles).
**Feature / tabla:** `clients` → `clients/`
**API:** `/api/clientes`
**Bloqueado por:** ISS-02 — Infraestructura de base de datos.
**Habilita:** ISS-04 — Seeders con Faker · ISS-05 — Swagger / OpenAPI.

**Variantes internas (en orden):**
- ISS-03-A fundación
- ISS-03-B getAll / getOne
- ISS-03-C create
- ISS-03-D update PUT / PATCH
- ISS-03-E delete físico / lógico

---

## ISS-03-A — Feature Client — fundación (capas, modelo, esqueleto, HTTP, cableado)

**Objetivo:** dejar el feature listo para CRUD con la arquitectura por capas — HTTP → Controller → Service → Repository → Model → Sequelize → BD —: modelo, repository, service, controller, routes, carpeta `http/` y cableado.
**Bloqueado por:** ISS-02.

### Criterios de aceptación (ISS-03-A)

- [ ] 4.0 Capa compartida `src/shared/` creada (AppError, BaseController, withTransaction)
- [ ] 4.1 Modelo `client.model.ts` con `status` + `timestamps: true` + bcrypt
- [ ] 4.2 Carpeta `dto/` con un archivo por operación (create/update/patch/response) + `index.ts`
- [ ] 4.3 Esqueletos `clients.repository.ts`, `clients.service.ts`, `clients.controller.ts` y `clients.routes.ts`
- [ ] 4.4 Carpeta `features/business/clients/http/` creada
- [ ] 4.5 `routes/index.ts` + `config` importan modelo, conectan BD y hacen sync
- [ ] Con BD: `npm run dev` → conexión OK + sync OK + tabla `clients`

### 4.0.1 `src/shared/errors/app-error.ts`

Crea las carpetas compartidas y el error de aplicación con status HTTP asociado (lo lanzan los services).

```bash
mkdir -p src/shared/errors src/shared/http src/shared/database
```

```bash
: > src/shared/errors/app-error.ts
cat >> src/shared/errors/app-error.ts << 'EOF'
/**
 * Error de aplicación con código HTTP asociado.
 *
 * Lo lanzan los **services** (capa de negocio) cuando una regla no se cumple
 * (no encontrado, estado inválido, stock insuficiente, etc.).
 * Los **controllers** lo traducen a una respuesta HTTP.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  public constructor(statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}
EOF
```

### 4.0.2 `src/shared/http/base-controller.ts`

Clase base de todos los controllers: concentra `run`, `paramId` y `handleError`.

```bash
: > src/shared/http/base-controller.ts
cat >> src/shared/http/base-controller.ts << 'EOF'
import { Request, Response } from "express";
import { AppError } from "../errors/app-error";

/**
 * Base de los controllers HTTP.
 *
 * Aísla las tres responsabilidades puramente HTTP que, si no, se repetirían en
 * los 7 métodos de cada controller:
 *
 *  - `run`:            ejecuta el cuerpo del handler y traduce el error a HTTP.
 *  - `paramId`:        lee y valida el `:id` de la URL.
 *  - `handleError`:    mapea `AppError` a su status y lo demás a 500.
 *
 * La capa de negocio (service) no conoce `req`/`res`.
 */
export abstract class BaseController {
  /**
   * Ejecuta el cuerpo de un handler y centraliza el manejo de errores.
   *
   * Sin este helper, cada uno de los 35 métodos de los controllers tendría su
   * propio `try/catch`. Aquí el `catch` vive una sola vez.
   */
  protected async run(res: Response, work: () => Promise<void>): Promise<void> {
    try {
      await work();
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Lee el `:id` de la URL y lo valida como entero positivo.
   *
   * Sin la validación, `GET /api/clientes/abc` llegaría al repository como
   * `Number("abc") === NaN` y devolvería un 404 engañoso en vez de un 400.
   */
  protected paramId(req: Request): number {
    const raw = req.params.id;
    const value = Array.isArray(raw) ? raw[0] : raw;

    if (!value || !/^\d+$/.test(value) || Number(value) < 1) {
      throw new AppError(400, "Invalid id: must be a positive integer");
    }
    return Number(value);
  }

  /** Mapea errores: `AppError` -> su status; cualquier otro -> 500. */
  protected handleError(res: Response, error: unknown): void {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Internal server error", detail: String(error) });
  }
}
EOF
```

### 4.0.3 `src/shared/database/with-transaction.ts`

Helper unit of work: ejecuta un bloque dentro de una transacción (commit/rollback).

```bash
: > src/shared/database/with-transaction.ts
cat >> src/shared/database/with-transaction.ts << 'EOF'
import { Transaction } from "sequelize";
import { sequelize } from "../../database/db";

/**
 * Ejecuta `work` dentro de una transacción (patrón *unit of work*).
 *
 * - Commit si `work` termina bien.
 * - Rollback si `work` lanza (y re-lanza el error).
 *
 * Lo usan los services que tocan varias tablas a la vez
 * (ej. crear una venta = `sales` + `product_sales` + stock de `products`).
 */
export async function withTransaction<T>(
  work: (transaction: Transaction) => Promise<T>
): Promise<T> {
  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    const result = await work(transaction);
    await transaction.commit();
    committed = true;
    return result;
  } catch (error) {
    if (!committed) {
      await transaction.rollback().catch(() => undefined);
    }
    throw error;
  }
}
EOF
```

### 4.1 Modelo Client

Instala `bcryptjs` (para hashear passwords en los hooks del modelo).

```bash
npm install bcryptjs@^3.0.3
npm install -D @types/bcryptjs@^3.0.0
```

Crea el modelo `client.model.ts` con status `active/inactive`, timestamps y hooks de bcrypt.

```bash
: > src/features/business/clients/client.model.ts
cat >> src/features/business/clients/client.model.ts << 'EOF'
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../../database/db";
import bcrypt from "bcryptjs";

export interface ClientI {
  id?: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  password: string;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export class Client extends Model {
  public id!: number;
  public name!: string;
  public address!: string;
  public phone!: string;
  public email!: string;
  public password!: string;
  public status!: "active" | "inactive";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Client.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: { msg: "Phone cannot be empty" },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: { msg: "Email must be a valid email address" },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      // Fail-safe: una fila insertada sin estado explícito NO queda visible en la API.
      // La vía de creación de la API siempre envía "active".
      defaultValue: "inactive",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Client",
    tableName: "clients",
    timestamps: true,
    hooks: {
      beforeCreate: async (client: Client) => {
        if (client.password) {
          const salt = await bcrypt.genSalt(10);
          client.password = await bcrypt.hash(client.password, salt);
        }
      },
      beforeUpdate: async (client: Client) => {
        if (client.changed("password") && client.password) {
          const salt = await bcrypt.genSalt(10);
          client.password = await bcrypt.hash(client.password, salt);
        }
      },
      beforeBulkCreate: async (clients: Client[]) => {
        for (const client of clients) {
          if (client.password) {
            const salt = await bcrypt.genSalt(10);
            client.password = await bcrypt.hash(client.password, salt);
          }
        }
      },
    },
  }
);
EOF
```

### 4.2 DTO + esqueletos repository / service / controller / routes + carpeta HTTP

Crea la carpeta `http/` y los cuatro DTOs (create, update, patch, response) más el barrel `index.ts`.

```bash
mkdir -p src/features/business/clients/http
mkdir -p src/features/business/clients/dto
```

**`dto/create-client.dto.ts`**

```bash
: > src/features/business/clients/dto/create-client.dto.ts
cat >> src/features/business/clients/dto/create-client.dto.ts << 'EOF'
/** Datos de entrada de `POST /api/clientes`. */
export interface CreateClientDto {
  name: string;
  address: string;
  phone: string;
  email: string;
  password: string;
  /** Opcional: por defecto `active`. Tras crearlo, el estado sólo cambia con el borrado lógico. */
  status?: "active" | "inactive";
}
EOF
```

**`dto/update-client.dto.ts`**

```bash
: > src/features/business/clients/dto/update-client.dto.ts
cat >> src/features/business/clients/dto/update-client.dto.ts << 'EOF'
/**
 * Datos de entrada de `PUT /api/clientes/:id` (reemplazo completo).
 *
 * `status` **no** está aquí a propósito: el estado sólo cambia con el borrado
 * lógico (`DELETE /api/clientes/:id/deactivate`), que es una regla de negocio y
 * no un campo editable. Así se evita desactivar un registro por PUT/PATCH
 * saltándose el resto de reglas del caso de uso.
 */
export interface UpdateClientDto {
  name: string;
  address: string;
  phone: string;
  email: string;
  /** Si no se envía, el service conserva el hash actual. */
  password?: string;
}
EOF
```

**`dto/patch-client.dto.ts`**

```bash
: > src/features/business/clients/dto/patch-client.dto.ts
cat >> src/features/business/clients/dto/patch-client.dto.ts << 'EOF'
import { UpdateClientDto } from "./update-client.dto";

/** Datos de entrada de `PATCH /api/clientes/:id` (actualización parcial). */
export type PatchClientDto = Partial<UpdateClientDto>;
EOF
```

**`dto/client-response.dto.ts`**

```bash
: > src/features/business/clients/dto/client-response.dto.ts
cat >> src/features/business/clients/dto/client-response.dto.ts << 'EOF'
import { Client, ClientI } from "../client.model";

/**
 * Respuesta HTTP de un cliente. Lo usan `GET /api/clientes`,
 * `GET /api/clientes/:id` y la salida de create/update/delete lógico.
 *
 * Regla del DTO de respuesta: la API expone **sólo** lo que declara este tipo y
 * `password` nunca sale. La proyección es explícita (`Omit`) porque hay algo que
 * ocultar; en las entidades que no tienen campos internos el DTO coincide con el
 * modelo y basta con documentarlo.
 */
export type ClientResponseDto = Omit<ClientI, "password">;

/** Mapper modelo -> DTO de respuesta (objeto plano; elimina `password`). */
export function toClientResponse(client: Client): ClientResponseDto {
  const { password, ...safe } = client.toJSON() as ClientI & { password?: string };
  return safe;
}
EOF
```

**`dto/index.ts` (barrel)**

```bash
: > src/features/business/clients/dto/index.ts
cat >> src/features/business/clients/dto/index.ts << 'EOF'
export * from "./create-client.dto";
export * from "./update-client.dto";
export * from "./patch-client.dto";
export * from "./client-response.dto";
EOF
```

**Esqueleto `clients.repository.ts`**

```bash
: > src/features/business/clients/clients.repository.ts
cat >> src/features/business/clients/clients.repository.ts << 'EOF'
import { Client } from "./client.model";

/**
 * Capa Repository del feature Clients.
 * Única responsable de hablar con Sequelize (el modelo `Client`).
 */
export class ClientsRepository {
  // ================== READ ==================
  // (rellenar en ISS-03-B) findAllActive, findById

  // ================== CREATE ==================
  // (rellenar en ISS-03-C) create

  // ================== UPDATE ==================
  // (rellenar en ISS-03-D) update

  // ================== DELETE ==================
  // (rellenar en ISS-03-E) delete
}
EOF
```

**Esqueleto `clients.service.ts`**

```bash
: > src/features/business/clients/clients.service.ts
cat >> src/features/business/clients/clients.service.ts << 'EOF'
import { ClientsRepository } from "./clients.repository";

/**
 * Capa Service del feature Clients.
 * Reglas de negocio; no conoce req/res ni Sequelize (delega en el repository).
 */
export class ClientsService {
  public constructor(
    private readonly repository: ClientsRepository = new ClientsRepository()
  ) {}

  // ================== READ ==================
  // (rellenar en ISS-03-B) getAll, getOne

  // ================== CREATE ==================
  // (rellenar en ISS-03-C) create

  // ================== UPDATE ==================
  // (rellenar en ISS-03-D) updatePut, updatePatch

  // ================== DELETE ==================
  // (rellenar en ISS-03-E) deletePhysical, deleteLogical
}
EOF
```

**Esqueleto `clients.controller.ts`**

```bash
: > src/features/business/clients/clients.controller.ts
cat >> src/features/business/clients/clients.controller.ts << 'EOF'
import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { ClientsService } from "./clients.service";

/**
 * Capa Controller del feature Clients.
 * Solo HTTP: lee req, llama al service y arma res.
 */
export class ClientsController extends BaseController {
  public constructor(
    private readonly service: ClientsService = new ClientsService()
  ) {
    super();
  }

  // ================== READ ==================
  // (rellenar en ISS-03-B) getAll, getOne

  // ================== CREATE ==================
  // (rellenar en ISS-03-C) create

  // ================== UPDATE ==================
  // (rellenar en ISS-03-D) updatePut, updatePatch

  // ================== DELETE ==================
  // (rellenar en ISS-03-E) deletePhysical, deleteLogical
}
EOF
```

**Esqueleto `clients.routes.ts`**

```bash
: > src/features/business/clients/clients.routes.ts
cat >> src/features/business/clients/clients.routes.ts << 'EOF'
import { Application } from "express";
import { ClientsController } from "./clients.controller";

export class ClientsRoutes {
  public clientsController: ClientsController = new ClientsController();

  public routes(app: Application): void {
    // ================== RUTAS SIN AUTENTICACIÓN / SIN MIDDLEWARE JWT ==================
    // (rellenar en ISS-03-B…E)
  }
}
EOF
```

### 4.3 Agregador Routes + cableado en Config

**`src/routes/index.ts`**

```bash
: > src/routes/index.ts
cat >> src/routes/index.ts << 'EOF'
import { ClientsRoutes } from "../features/business/clients/clients.routes";

export class Routes {
  public clientsRoutes: ClientsRoutes = new ClientsRoutes();
}
EOF
```

**PARCHE — `src/config/index.ts` ya existe (ISS-01).**

Debajo de `var cors = require("cors");` añadir:

```typescript
import { sequelize, getDatabaseInfo, testConnection } from "../database/db";
import "../features/business/clients/client.model";
import { Routes } from "../routes/index";
```

Dentro de `export class App`, debajo de `public app: Application;` añadir:

```typescript
  public routePrv: Routes = new Routes();
```

Dentro de `routes()`, reemplazar el comentario `// ISS-03 §4.3` por:

```typescript
    this.routePrv.clientsRoutes.routes(this.app);
```

Dentro de `dbConnection()`, reemplazar el comentario `// ISS-02 / ISS-03` por:

```typescript
    try {
      // Mostrar información de la base de datos seleccionada
      const dbInfo = getDatabaseInfo();
      console.log(`🔗 Intentando conectar a: ${dbInfo.engine.toUpperCase()}`);

      // Probar la conexión
      const isConnected = await testConnection();

      if (!isConnected) {
        throw new Error(`No se pudo conectar a la base de datos ${dbInfo.engine.toUpperCase()}`);
      }

      // alter: true actualiza columnas faltantes (ej. createdAt/updatedAt tras timestamps: true).
      // force: false no recrea tablas; no borra datos. En producción preferir migraciones.
      await sequelize.sync({ force: false, alter: true });
      console.log(`📦 Base de datos sincronizada exitosamente`);
    } catch (error) {
      console.error("❌ Error al conectar con la base de datos:", error);
      process.exit(1); // Terminar la aplicación si no se puede conectar
    }
```

> **Importante (lab):** si la tabla `clients` se creó antes con `timestamps: false`, `sync({ force: false })` no añade `createdAt`/`updatedAt`. Por eso se usa `alter: true`.

### Verificación ISS-03-A

```bash
test -d src/features/business/clients/http && echo HTTP_FOLDER_OK
```

### Cierre del ISS-03-A

```bash
npm run dev
```

Sync OK y tabla `clients` (con `createdAt` / `updatedAt`). Detenerlo con `Ctrl+C` antes de continuar.

---

## ISS-03-B — Feature Client — GetAll y GetOne

**Objetivo:** listar activos y obtener uno por id.
**Bloqueado por:** ISS-03-A.

### Criterios de aceptación (ISS-03-B)

- [ ] Repository: `findAllActive` (solo `status: 'active'`) y, debajo, `findById`
- [ ] Service: `getAll` y `getOne` (404 si no existe o está inactive) + mapper `toClientResponse` (sin password)
- [ ] Service: helper privado `findOrFail(id, onlyActive = true)`
- [ ] Controller: `getAll` y, debajo, `getOne` (envueltos en `run()`)
- [ ] Rutas `GET /api/clientes` y `GET /api/clientes/:id`
- [ ] `http/clients.get.http`

### Repository — PARCHE `clients.repository.ts`

Arriba, junto al import del modelo, añadir el import de `Transaction`:

```typescript
import { Transaction } from "sequelize";
```

Debajo de `// ================== READ ==================` añadir:

```typescript
  /** Todos los clientes activos. */
  public async findAllActive(): Promise<Client[]> {
    return Client.findAll({ where: { status: "active" } });
  }

  /** Un cliente por PK (o `null`). Acepta transacción para flujos de ventas. */
  public async findById(id: number, transaction?: Transaction): Promise<Client | null> {
    return Client.findByPk(id, { transaction });
  }
```

### Service — PARCHE `clients.service.ts`

Arriba, junto al import del repository, añadir:

```typescript
import { ClientResponseDto, toClientResponse } from "./dto";
import { Client } from "./client.model";
import { AppError } from "../../../shared/errors/app-error";
```

Debajo de `// ================== READ ==================` añadir:

```typescript
  public async getAll(): Promise<ClientResponseDto[]> {
    const clients = await this.repository.findAllActive();
    return clients.map((client) => toClientResponse(client));
  }

  public async getOne(id: number): Promise<ClientResponseDto> {
    return toClientResponse(await this.findOrFail(id));
  }
```

Al final de la clase, debajo de `// ================== HELPERS ==================`, añadir:

```typescript
  private async findOrFail(id: number, onlyActive = true): Promise<Client> {
    const client = await this.repository.findById(id);
    if (!client || (onlyActive && client.status !== "active")) {
      throw new AppError(404, "Client not found");
    }
    return client;
  }
```

### Controller — PARCHE `clients.controller.ts`

Debajo de `// ================== READ ==================` añadir:

```typescript
  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const clients = await this.service.getAll();
      res.status(200).json({ clients });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const client = await this.service.getOne(this.paramId(req));
      res.status(200).json({ client });
    });
  }
```

### Rutas — PARCHE `clients.routes.ts`

Debajo del comentario de rutas sin auth, añadir:

```typescript
    // getAll
    app
      .route("/api/clientes")
      .get(this.clientsController.getAll.bind(this.clientsController));

    // getOne
    app
      .route("/api/clientes/:id")
      .get(this.clientsController.getOne.bind(this.clientsController));
```

### HTTP — archivo nuevo

```bash
: > src/features/business/clients/http/clients.get.http
cat >> src/features/business/clients/http/clients.get.http << 'EOF'
### Feature Client — GET ALL / GET ONE
@baseUrl = http://localhost:4000

### GET ALL
GET {{baseUrl}}/api/clientes

### GET ONE
GET {{baseUrl}}/api/clientes/1
EOF
```

---

## ISS-03-C — Feature Client — Crear cliente

**Objetivo:** `create` con `status` por defecto `active` y hash de password (hook del modelo).
**Bloqueado por:** ISS-03-B.

### Criterios de aceptación (ISS-03-C)

- [ ] Repository: `create`
- [ ] Service: `create` (default de status) y respuesta sin password
- [ ] Controller: `create` con 201
- [ ] Ruta `POST /api/clientes`
- [ ] `http/clients.create.http`

### Repository — PARCHE `clients.repository.ts`

Ampliar el import de sequelize para incluir `CreationAttributes`:

```typescript
import { CreationAttributes, Transaction } from "sequelize";
```

Debajo de `// ================== CREATE ==================` añadir:

```typescript
  /** Inserta un cliente. */
  public async create(data: CreationAttributes<Client>): Promise<Client> {
    return Client.create(data);
  }
```

### Service — PARCHE `clients.service.ts`

Debajo de `// ================== CREATE ==================` añadir:

```typescript
  public async create(body: CreateClientDto): Promise<ClientResponseDto> {
    const client = await this.repository.create({
      name: body.name,
      address: body.address,
      phone: body.phone,
      email: body.email,
      password: body.password,
      status: body.status ?? "active",
    });
    return toClientResponse(client);
  }
```

### Controller — PARCHE `clients.controller.ts`

Añadir import arriba:

```typescript
import { CreateClientDto, PatchClientDto, UpdateClientDto } from "./dto";
```

Debajo de `// ================== CREATE ==================` añadir:

```typescript
  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const client = await this.service.create(req.body as CreateClientDto);
      res.status(201).json({ client });
    });
  }
```

### Rutas — PARCHE `clients.routes.ts`

Debajo del bloque de `getOne`, añadir:

```typescript
    // create
    app
      .route("/api/clientes")
      .post(this.clientsController.create.bind(this.clientsController));
```

### HTTP — archivo nuevo

```bash
: > src/features/business/clients/http/clients.create.http
cat >> src/features/business/clients/http/clients.create.http << 'EOF'
### Feature Client — CREATE
@baseUrl = http://localhost:4000

### CREATE
POST {{baseUrl}}/api/clientes
Content-Type: application/json

{
  "name": "Ana Pérez",
  "address": "Calle 10 #20-30",
  "phone": "3001234567",
  "email": "ana.perez@example.com",
  "password": "Password123!",
  "status": "active"
}
EOF
```

---

## ISS-03-D — Feature Client — Update (PUT) y Update (PATCH)

**Objetivo:** `updatePut` (reemplazo completo) y `updatePatch` (parcial).
**Bloqueado por:** ISS-03-C.

### Criterios de aceptación (ISS-03-D)

- [ ] Repository: `update`
- [ ] Service: `updatePut` (conserva password si no viene) y `updatePatch`
- [ ] Service: `status` no se edita por PUT/PATCH
- [ ] Controller: `updatePut` y `updatePatch`
- [ ] Rutas `PUT /api/clientes/:id` y `PATCH /api/clientes/:id`
- [ ] `http/clients.update.http`

### Repository — PARCHE `clients.repository.ts`

Debajo de `// ================== UPDATE ==================` añadir:

```typescript
  /** Persiste cambios sobre una instancia existente. */
  public async update(client: Client, data: Partial<ClientI>): Promise<Client> {
    return client.update(data);
  }
```

### Service — PARCHE `clients.service.ts`

Debajo de `// ================== UPDATE ==================` añadir:

```typescript
  public async updatePut(id: number, body: UpdateClientDto): Promise<ClientResponseDto> {
    const client = await this.findOrFail(id);

    await this.repository.update(client, {
      name: body.name,
      address: body.address,
      phone: body.phone,
      email: body.email,
      password: body.password ?? client.password,
    });
    return toClientResponse(client);
  }

  public async updatePatch(id: number, body: PatchClientDto): Promise<ClientResponseDto> {
    const client = await this.findOrFail(id);

    await this.repository.update(client, body);
    return toClientResponse(client);
  }
```

### Controller — PARCHE `clients.controller.ts`

Debajo de `// ================== UPDATE ==================` añadir:

```typescript
  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const client = await this.service.updatePut(
        this.paramId(req),
        req.body as UpdateClientDto
      );
      res.status(200).json({ client });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const client = await this.service.updatePatch(
        this.paramId(req),
        req.body as PatchClientDto
      );
      res.status(200).json({ client });
    });
  }
```

### Rutas — PARCHE `clients.routes.ts`

Debajo del bloque de `create`, añadir:

```typescript
    // update (PUT / PATCH)
    app
      .route("/api/clientes/:id")
      .put(this.clientsController.updatePut.bind(this.clientsController))
      .patch(this.clientsController.updatePatch.bind(this.clientsController));
```

### HTTP — archivo nuevo

```bash
: > src/features/business/clients/http/clients.update.http
cat >> src/features/business/clients/http/clients.update.http << 'EOF'
### Feature Client — UPDATE (PUT) / UPDATE (PATCH)
@baseUrl = http://localhost:4000
@id = 1

### PUT
PUT {{baseUrl}}/api/clientes/{{id}}
Content-Type: application/json

{
  "name": "Ana Pérez Actualizada",
  "address": "Carrera 15 #40-10",
  "phone": "3009876543",
  "email": "ana.perez@example.com",
  "password": "Password123!"
}

### PATCH
PATCH {{baseUrl}}/api/clientes/{{id}}
Content-Type: application/json

{
  "phone": "3011112233",
  "address": "Nueva dirección parcial"
}
EOF
```

---

## ISS-03-E — Feature Client — Eliminar (físico y lógico)

**Objetivo:** `deletePhysical` (DELETE) y `deleteLogical` (status = inactive).
**Bloqueado por:** ISS-03-D.

### Criterios de aceptación (ISS-03-E)

- [ ] Repository: `delete`
- [ ] Service: `deletePhysical` y `deleteLogical`
- [ ] Controller: `deletePhysical` y `deleteLogical`
- [ ] Rutas `DELETE /api/clientes/:id` y `PATCH /api/clientes/:id/deactivate`
- [ ] `http/clients.delete.http`

### Repository — PARCHE `clients.repository.ts`

Debajo de `// ================== DELETE ==================` añadir:

```typescript
  /** Elimina físicamente una instancia. */
  public async delete(client: Client): Promise<void> {
    await client.destroy();
  }
```

### Service — PARCHE `clients.service.ts`

Debajo de `// ================== DELETE ==================` añadir:

```typescript
  /** Eliminación física. */
  public async deletePhysical(id: number): Promise<void> {
    const client = await this.findOrFail(id, false);
    await this.repository.delete(client);
  }

  /** Eliminación lógica -> `status = inactive`. */
  public async deleteLogical(id: number): Promise<ClientResponseDto> {
    const client = await this.findOrFail(id);

    await this.repository.update(client, { status: "inactive" });
    return toClientResponse(client);
  }
```

### Controller — PARCHE `clients.controller.ts`

Debajo de `// ================== DELETE ==================` añadir:

```typescript
  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "Client permanently deleted", id });
    });
  }

  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const client = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({ message: "Client deactivated (logical delete)", client });
    });
  }
```

### Rutas — PARCHE `clients.routes.ts`

Debajo del bloque de `update`, añadir:

```typescript
    // delete físico
    app
      .route("/api/clientes/:id")
      .delete(this.clientsController.deletePhysical.bind(this.clientsController));

    // delete lógico
    app
      .route("/api/clientes/:id/deactivate")
      .patch(this.clientsController.deleteLogical.bind(this.clientsController));
```

### HTTP — archivo nuevo

```bash
: > src/features/business/clients/http/clients.delete.http
cat >> src/features/business/clients/http/clients.delete.http << 'EOF'
### Feature Client — DELETE físico / DELETE lógico
@baseUrl = http://localhost:4000
@id = 1

### DELETE físico
DELETE {{baseUrl}}/api/clientes/{{id}}

### DELETE lógico
PATCH {{baseUrl}}/api/clientes/{{id}}/deactivate
EOF
```

---

## Estado final Client (CRUD completo) — archivos consolidados

Si prefieres pegar los archivos **completos** en lugar de ir aplicando PARCHEs uno por uno, este es el estado final del feature.

**DTOs — `dto/`**

```bash
: > src/features/business/clients/dto/create-client.dto.ts
cat >> src/features/business/clients/dto/create-client.dto.ts << 'EOF'
export interface CreateClientDto {
  name: string;
  address: string;
  phone: string;
  email: string;
  password: string;
  status?: "active" | "inactive";
}
EOF

: > src/features/business/clients/dto/update-client.dto.ts
cat >> src/features/business/clients/dto/update-client.dto.ts << 'EOF'
export interface UpdateClientDto {
  name: string;
  address: string;
  phone: string;
  email: string;
  password?: string;
}
EOF

: > src/features/business/clients/dto/patch-client.dto.ts
cat >> src/features/business/clients/dto/patch-client.dto.ts << 'EOF'
import { UpdateClientDto } from "./update-client.dto";
export type PatchClientDto = Partial<UpdateClientDto>;
EOF

: > src/features/business/clients/dto/client-response.dto.ts
cat >> src/features/business/clients/dto/client-response.dto.ts << 'EOF'
import { Client, ClientI } from "../client.model";

export type ClientResponseDto = Omit<ClientI, "password">;

export function toClientResponse(client: Client): ClientResponseDto {
  const { password, ...safe } = client.toJSON() as ClientI & { password?: string };
  return safe;
}
EOF

: > src/features/b