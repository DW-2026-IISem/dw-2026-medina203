# 🛠 ISS-13 · Middlewares de acceso y las 3 modalidades — app-textilclean-express

**Proyecto:** app-textilclean-express — Express 5 + TypeScript + Sequelize, arquitectura por features.
**Fase II:** Auth con RBAC.
**Feature / tablas:** `features/auth/access/` + PARCHE de las 5 rutas de negocio.
**API:** todas las de Fase I pasan a **JWT + RBAC**.
**Depende de:** ISS-12 — RoleUsers y ResourceRoles.
**Habilita:** ISS-14 — Feature RefreshTokens.

**Objetivo:** materializar las tres modalidades mediante dos middlewares componibles y aplicarlos a las rutas existentes sin tocar controllers, services ni repositories.

```
OPEN            app.route(...).get(controller)
JWT             app.route(...).get(authenticate, controller)
JWT + RBAC      app.route(...).get(authenticate, authorize, controller)
```

---

## Criterios de aceptación (ISS-13)

- [ ] 18.1 `authenticate` valida el Bearer token, verifica algoritmo/issuer/audience/exp y carga el usuario activo en `req.auth`
- [ ] 18.2 `authorize` resuelve `(method, path)` y busca concesión activa; deny by default → **403**
- [ ] 18.3 `access/index.ts` reexporta ambos middlewares
- [ ] 18.4 Las 5 features de negocio aplican `authenticate, authorize`
- [ ] 18.5 Documentadas las tres modalidades
- [ ] 18.6 Sin token → **401**; con token pero sin concesión → **403**; con concesión → **200/201**
- [ ] `npx tsc --noEmit` OK

```bash
mkdir -p src/features/auth/access
```

---

## 18.1 `authenticate.middleware.ts` — modalidad JWT

```bash
: > src/features/auth/access/authenticate.middleware.ts
cat >> src/features/auth/access/authenticate.middleware.ts << 'EOF'
import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { sendError } from "../../../shared/http/error-response";
import { extractBearerToken, verifyAccessToken } from "../../../shared/auth/jwt";
import { UsersRepository } from "../users/users.repository";

/**
 * MODALIDAD 2 — JWT (identidad). Middleware de autenticación.
 *
 * Responde a **¿quién eres?**:
 *  1. Lee el token de `Authorization: Bearer <token>`.
 *  2. Verifica firma, algoritmo, iss, aud, exp.
 *  3. Revalida contra la BD que el usuario sigue existiendo y con status=active.
 *
 * NO consulta la matriz de permisos: eso es responsabilidad de `authorize`.
 * Cualquier fallo → **401 (no autenticado)**.
 */
const usersRepository = new UsersRepository();

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      throw new AppError(401, "Missing Bearer token");
    }

    const payload = verifyAccessToken(token);

    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId < 1) {
      throw new AppError(401, "Invalid or expired access token");
    }

    const user = await usersRepository.findById(userId);

    if (!user || user.status !== "active") {
      throw new AppError(401, "User is not active");
    }

    req.auth = {
      id: user.id,
      username: user.username,
      email: user.email,
      tokenId: payload.jti,
    };
    next();
  } catch (error) {
    sendError(res, error);
  }
}
EOF
```

---

## 18.2 `authorize.middleware.ts` — modalidad JWT + RBAC

```bash
: > src/features/auth/access/authorize.middleware.ts
cat >> src/features/auth/access/authorize.middleware.ts << 'EOF'
import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { sendError } from "../../../shared/http/error-response";
import { isOperationGranted, normalizePath } from "../../../shared/auth/resource-match";
import { ResourceRolesRepository } from "../resource-roles/resource-roles.repository";

/**
 * MODALIDAD 3 — RBAC (identidad + autorización granular).
 *
 * Debe montarse **después** de `authenticate`.
 *
 *  1. Toma la identidad de `req.auth`.
 *  2. Consulta la cadena RBAC completa (resource_roles → roles → role_users → resources).
 *  3. Compara `(method, path)` por patrón.
 *
 * Reglas:
 *  - **Deny by default**: sin concesión activa → 403.
 *  - **401** si no hay identidad.
 *  - **403** si hay identidad válida pero no hay permiso.
 */
const resourceRolesRepository = new ResourceRolesRepository();

export async function authorize(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      throw new AppError(401, "Authentication required");
    }

    const method = req.method.toUpperCase();
    const path = normalizePath(req.originalUrl);

    const granted = await resourceRolesRepository.findEffectiveForUser(req.auth.id);

    if (!isOperationGranted(granted, method, path)) {
      throw new AppError(403, `Forbidden: no grant for ${method} ${path}`);
    }

    next();
  } catch (error) {
    sendError(res, error);
  }
}
EOF
```

---

## 18.3 Barrel de acceso

```bash
: > src/features/auth/access/index.ts
cat >> src/features/auth/access/index.ts << 'EOF'
export * from "./authenticate.middleware";
export * from "./authorize.middleware";
EOF
```

---

## 18.4 PARCHE: las 5 rutas de negocio pasan a JWT + RBAC

> **Nota:** en el ISS-11 y ISS-12 creaste los `.routes.ts` de Auth con los middlewares **comentados**. En este ISS los activas. También tienes que activar los de `users.routes.ts`, `roles.routes.ts`, `resources.routes.ts`, `role-users.routes.ts` y `resource-roles.routes.ts`.

### `clients.routes.ts`

```bash
: > src/features/business/clients/clients.routes.ts
cat >> src/features/business/clients/clients.routes.ts << 'EOF'
import { Application } from "express";
import { ClientsController } from "./clients.controller";
import { authenticate, authorize } from "../../auth/access";

export class ClientsRoutes {
  public clientsController: ClientsController = new ClientsController();

  public routes(app: Application): void {
    app
      .route("/api/clientes")
      .get(authenticate, authorize, this.clientsController.getAll.bind(this.clientsController))
      .post(authenticate, authorize, this.clientsController.create.bind(this.clientsController));

    app
      .route("/api/clientes/:id")
      .get(authenticate, authorize, this.clientsController.getOne.bind(this.clientsController))
      .put(authenticate, authorize, this.clientsController.updatePut.bind(this.clientsController))
      .patch(authenticate, authorize, this.clientsController.updatePatch.bind(this.clientsController))
      .delete(authenticate, authorize, this.clientsController.deletePhysical.bind(this.clientsController));

    app
      .route("/api/clientes/:id/deactivate")
      .patch(authenticate, authorize, this.clientsController.deleteLogical.bind(this.clientsController));
  }
}
EOF
```

### `product-types.routes.ts`

```bash
: > src/features/business/product-types/product-types.routes.ts
cat >> src/features/business/product-types/product-types.routes.ts << 'EOF'
import { Application } from "express";
import { ProductTypesController } from "./product-types.controller";
import { authenticate, authorize } from "../../auth/access";

export class ProductTypesRoutes {
  public productTypesController: ProductTypesController = new ProductTypesController();

  public routes(app: Application): void {
    app
      .route("/api/tipos-producto")
      .get(authenticate, authorize, this.productTypesController.getAll.bind(this.productTypesController))
      .post(authenticate, authorize, this.productTypesController.create.bind(this.productTypesController));

    app
      .route("/api/tipos-producto/:id")
      .get(authenticate, authorize, this.productTypesController.getOne.bind(this.productTypesController))
      .put(authenticate, authorize, this.productTypesController.updatePut.bind(this.productTypesController))
      .patch(authenticate, authorize, this.productTypesController.updatePatch.bind(this.productTypesController))
      .delete(authenticate, authorize, this.productTypesController.deletePhysical.bind(this.productTypesController));

    app
      .route("/api/tipos-producto/:id/deactivate")
      .patch(authenticate, authorize, this.productTypesController.deleteLogical.bind(this.productTypesController));
  }
}
EOF
```

### `products.routes.ts`

```bash
: > src/features/business/products/products.routes.ts
cat >> src/features/business/products/products.routes.ts << 'EOF'
import { Application } from "express";
import { ProductsController } from "./products.controller";
import { authenticate, authorize } from "../../auth/access";

export class ProductsRoutes {
  public productsController: ProductsController = new ProductsController();

  public routes(app: Application): void {
    app
      .route("/api/productos")
      .get(authenticate, authorize, this.productsController.getAll.bind(this.productsController))
      .post(authenticate, authorize, this.productsController.create.bind(this.productsController));

    app
      .route("/api/productos/:id")
      .get(authenticate, authorize, this.productsController.getOne.bind(this.productsController))
      .put(authenticate, authorize, this.productsController.updatePut.bind(this.productsController))
      .patch(authenticate, authorize, this.productsController.updatePatch.bind(this.productsController))
      .delete(authenticate, authorize, this.productsController.deletePhysical.bind(this.productsController));

    app
      .route("/api/productos/:id/deactivate")
      .patch(authenticate, authorize, this.productsController.deleteLogical.bind(this.productsController));
  }
}
EOF
```

### `sales.routes.ts`

```bash
: > src/features/business/sales/sales.routes.ts
cat >> src/features/business/sales/sales.routes.ts << 'EOF'
import { Application } from "express";
import { SalesController } from "./sales.controller";
import { authenticate, authorize } from "../../auth/access";

export class SalesRoutes {
  public salesController: SalesController = new SalesController();

  public routes(app: Application): void {
    app
      .route("/api/ventas")
      .get(authenticate, authorize, this.salesController.getAll.bind(this.salesController))
      .post(authenticate, authorize, this.salesController.create.bind(this.salesController));

    app
      .route("/api/ventas/:id")
      .get(authenticate, authorize, this.salesController.getOne.bind(this.salesController))
      .put(authenticate, authorize, this.salesController.updatePut.bind(this.salesController))
      .patch(authenticate, authorize, this.salesController.updatePatch.bind(this.salesController))
      .delete(authenticate, authorize, this.salesController.deletePhysical.bind(this.salesController));

    app
      .route("/api/ventas/:id/deactivate")
      .patch(authenticate, authorize, this.salesController.deleteLogical.bind(this.salesController));
  }
}
EOF
```

### `product-sales.routes.ts`

```bash
: > src/features/business/product-sales/product-sales.routes.ts
cat >> src/features/business/product-sales/product-sales.routes.ts << 'EOF'
import { Application } from "express";
import { ProductSalesController } from "./product-sales.controller";
import { authenticate, authorize } from "../../auth/access";

export class ProductSalesRoutes {
  public productSalesController: ProductSalesController = new ProductSalesController();

  public routes(app: Application): void {
    app
      .route("/api/detalle-ventas")
      .get(authenticate, authorize, this.productSalesController.getAll.bind(this.productSalesController))
      .post(authenticate, authorize, this.productSalesController.create.bind(this.productSalesController));

    app
      .route("/api/detalle-ventas/:id")
      .get(authenticate, authorize, this.productSalesController.getOne.bind(this.productSalesController))
      .put(authenticate, authorize, this.productSalesController.updatePut.bind(this.productSalesController))
      .patch(authenticate, authorize, this.productSalesController.updatePatch.bind(this.productSalesController))
      .delete(authenticate, authorize, this.productSalesController.deletePhysical.bind(this.productSalesController));

    app
      .route("/api/detalle-ventas/:id/deactivate")
      .patch(authenticate, authorize, this.productSalesController.deleteLogical.bind(this.productSalesController));
  }
}
EOF
```

### Activa los middlewares en las rutas de Auth

En `users.routes.ts`, `roles.routes.ts`, `resources.routes.ts`, `role-users.routes.ts` y `resource-roles.routes.ts`:

**Antes** (ISS-10/11/12):
```typescript
// import { authenticate, authorize } from "../access";
app.route("/api/usuarios").get(this.usersController.getAll.bind(this.usersController));
```

**Después** (ISS-13):
```typescript
import { authenticate, authorize } from "../access";
app.route("/api/usuarios").get(authenticate, authorize, this.usersController.getAll.bind(this.usersController));
```

**Y en `src/config/index.ts`**, añade en `routes()` (después de las 5 de business):

```typescript
    this.routePrv.usersRoutes.routes(this.app);
    this.routePrv.rolesRoutes.routes(this.app);
    this.routePrv.resourcesRoutes.routes(this.app);
    this.routePrv.roleUsersRoutes.routes(this.app);
    this.routePrv.resourceRolesRoutes.routes(this.app);
```

**Y en `src/routes/index.ts`**, añade:

```typescript
import { UsersRoutes } from "../features/auth/users/users.routes";
import { RolesRoutes } from "../features/auth/roles/roles.routes";
import { ResourcesRoutes } from "../features/auth/resources/resources.routes";
import { RoleUsersRoutes } from "../features/auth/role-users/role-users.routes";
import { ResourceRolesRoutes } from "../features/auth/resource-roles/resource-roles.routes";

// dentro de la clase Routes:
public usersRoutes: UsersRoutes = new UsersRoutes();
public rolesRoutes: RolesRoutes = new RolesRoutes();
public resourcesRoutes: ResourcesRoutes = new ResourcesRoutes();
public roleUsersRoutes: RoleUsersRoutes = new RoleUsersRoutes();
public resourceRolesRoutes: ResourceRolesRoutes = new ResourceRolesRoutes();
```

---

## 18.5 Las tres modalidades en una tabla

| Modalidad | Middleware | Qué exige | Sin cumplir |
|---|---|---|---|
| OPEN | — | nada | — |
| JWT | `authenticate` | access token válido y usuario activo | **401** |
| JWT + RBAC | `authenticate, authorize` | token válido y concesión activa de `(method, path)` | **401** / **403** |

| Petición | Resultado |
|---|---|
| `GET /api/clientes` sin Authorization | **401** |
| `GET /api/clientes` con token de `seller` | **200** |
| `POST /api/clientes` con token de `seller` | **403** |
| `POST /api/clientes` con token de `admin` | **201** |
| `GET /api/clientes/abc` con token válido | **400** |
| Cualquier ruta con token caducado o manipulado | **401** |

---

## 18.6 Verificación de 401 y 403

```bash
npm run dev
```

En otra terminal:

```bash
# 401 — sin token
curl -i http://localhost:3000/api/clientes

# 401 — token manipulado
curl -i -H "Authorization: Bearer no.es.un.jwt" http://localhost:3000/api/clientes

# 200 — seller lee
TOKEN=$(curl -s -X POST http://localhost:3000/api/sesion/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"seller","password":"Seller123!"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).access_token")
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/clientes

# 403 — seller intenta crear
curl -i -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"x","phone":"1","email":"x@x.com","password":"x"}' \
  http://localhost:3000/api/clientes
```

> **⚠️ Nota:** para poder probar `POST /api/sesion/login` necesitas el **ISS-14 (RefreshTokens)** y el **ISS-15 (sesión/login)**. En este punto del lab, si no has hecho login todavía, no tienes token. Puedes:
> - Saltarte la prueba funcional del 401/403 hasta ISS-15.
> - O insertar un token falso y verificar que responde 401.
>
> El código del middleware **sí compila** y **sí se ejecuta**. La prueba completa llega en ISS-15.

---

## DoD del ISS-13

- [ ] Todos los criterios de aceptación (18.1 … 18.6) cumplidos
- [ ] `GET /api/clientes` pasa de SIN AUTH a exigir token (**401** sin él)
- [ ] `POST /api/clientes` con seller → **403**; con admin → **201**
- [ ] Los controllers, services y repositories de Fase I **no fueron modificados**
- [ ] `npx tsc --noEmit` sin errores y `npm run dev` arranca

---

## ✅ GATE de la unidad ISS-13

Con el GATE en verde queda habilitado **ISS-14 · Feature RefreshTokens (sesiones)**.

---

**Navegación de la ruta:** ← ISS-13 · 🧠 Aprender · ↑ Ruta Express · → ISS-14 · 🧠 Aprender