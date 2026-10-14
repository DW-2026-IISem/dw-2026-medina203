# 🛠 ISS-01 · Esqueleto del proyecto — app-textilclean-express

**Proyecto:** app-textilclean-express — Express 5 + TypeScript + Sequelize, arquitectura por features. **Fase I:** Business (sin auth ni roles). **Objetivo:** proyecto npm + TypeScript + Express con estructura `features/` y servidor HTTP base. **Bloqueado por:** ISS-00 — Requisitos previos. **Habilita:** ISS-02 — Infraestructura de base de datos.

------------------------------------------------------------------------

## Criterios de aceptación (ISS-01)

- [ ] 2.1 Existe `package.json` con `"type": "commonjs"` y scripts `build` / `dev`
- [ ] 2.2 Árbol `src/` con `config`, `database/seeders`, `routes`, `shared`, `features/business/clients`
- [ ] 2.3 Dependencias Express/TS instaladas (`npm ls --depth=0`)
- [ ] 2.4 Existe `tsconfig.json` (`rootDir: ./src`, `outDir: ./dist`, `strict: true`)
- [ ] 2.5 Existen `src/server.ts` y `src/config/index.ts` (esqueleto App)
- [ ] `npx tsc --noEmit` sin errores al cerrar el ISS

------------------------------------------------------------------------

## 2.1 Inicializar npm y scripts

Crea la carpeta raíz del proyecto, inicializa npm y crea la carpeta `docs`.

``` bash
mkdir app-textilclean-express
cd app-textilclean-express
npm init -y
mkdir -p docs
```

![](imagenes/Captura%20de%20pantalla%202026-10-05%20220730%20-%20copia.png){width="475"}

**PARCHE — `package.json` ya existe (lo creó `npm init -y`).**

Dentro de `"scripts"` deja solo (o añade) `build` y `dev` como abajo. Debajo de `"license"` (o al mismo nivel que `"scripts"`): asegúrate de `"type": "commonjs"`.

Estado esperado de esas claves:

``` json
{
  "scripts": {
    "build": "tsc",
    "dev": "nodemon --watch src --ext ts --exec ts-node -- src/server.ts"
  },
  "type": "commonjs"
}
```

Verifica que los scripts quedaron registrados:

``` bash
node -e "const p=require('./package.json'); console.log(p.scripts)"
```

![](imagenes/Captura%20de%20pantalla%202026-10-06%20204518.png)

## 2.2 Estructura de carpetas (features)

Crea el árbol de carpetas base: infraestructura, shared, routes y el feature `business/clients`.

``` bash
mkdir -p \
  src/config \
  src/database/seeders \
  src/routes \
  src/shared/errors \
  src/shared/http \
  src/shared/database \
  src/features/business/clients
```

![](imagenes/Captura%20de%20pantalla%202026-10-06%20204842.png)

Árbol esperado:

```         
src/
├── config/
├── database/
│   └── seeders/          # solo carpeta (ISS-02 §3.3); runner en ISS-04
├── routes/
├── shared/               # reutilizable por todos los features (ISS-03-A §4.0)
│   ├── database/         # with-transaction.ts (unit of work)
│   ├── errors/           # app-error.ts
│   └── http/             # base-controller.ts
├── features/
│   └── business/
│       └── clients/      # más features en ISS-06…08; capas en ISS-03-A §4.0
└── server.ts             # §2.5
```

Verifica el árbol creado:

``` bash
find src -type d | sort
```

![](imagenes/Captura%20de%20pantalla%202026-10-06%20221925.png)

------------------------------------------------------------------------

## 2.3 Dependencias base (Express + TypeScript)

Instala dependencias de producción: Express 5, cors, dotenv y morgan.

``` bash
npm install express@^5.2.1 cors@^2.8.6 dotenv@^17.4.2 morgan@^1.12.1
```

![](imagenes/Captura%20de%20pantalla%202026-10-06%20222028.png)

Instala dependencias de desarrollo: TypeScript 5.9.x (por compatibilidad con ts-node), ts-node, nodemon y los `@types/*`.

``` bash
npm install -D typescript@~5.9.2 ts-node@^10.9.2 nodemon@^3.1.14 \
  @types/node@^22.20.3 @types/express@^5.0.6 \
  @types/cors@^2.8.19 @types/morgan@^1.9.10
```

![](imagenes/Captura%20de%20pantalla%202026-10-06%20222219.png)

Verifica las dependencias instaladas a primer nivel:

``` bash
npm ls --depth=0
```

![](imagenes/Captura%20de%20pantalla%202026-10-06%20222558.png)

------------------------------------------------------------------------

## 2.4 TypeScript (tsconfig.json)

Crea el archivo `tsconfig.json` con la configuración estricta del lab (`rootDir: ./src`, `outDir: ./dist`, `strict: true`).![](imagenes/Captura%20de%20pantalla%202026-10-06%20223914.png)

``` bash
: > tsconfig.json
cat >> tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "types": ["node"],
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "strict": true,
    "skipLibCheck": true,
    "moduleDetection": "force",
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
```

![](imagenes/Captura%20de%20pantalla%202026-10-06%20223914.png)

Verifica que el archivo existe y muestra la configuración resuelta:

``` bash
test -f tsconfig.json && npx tsc --showConfig | head -20
```

![](imagenes/Captura%20de%20pantalla%202026-10-06%20224502.png)

------------------------------------------------------------------------

## 2.5 Servidor y App (esqueleto HTTP)

### 2.5.1 `src/server.ts`

Punto de entrada: instancia `App` y levanta el servidor.

``` bash
: > src/server.ts
cat >> src/server.ts << 'EOF'
import { App } from './config/index';

async function main() {
    const app = new App();
    await app.listen();
}

main();
EOF
```

![](imagenes/Captura%20de%20pantalla%202026-10-06%20224601.png)

### 2.5.2 `src/config/index.ts` (esqueleto)

Esqueleto del `App`. En ISS-01 es base; los imports de modelos, associations, Routes, Swagger y el sync completo se añaden con PARCHE en ISS-02…08.

``` bash
: > src/config/index.ts
cat >> src/config/index.ts << 'EOF'
import dotenv from "dotenv";
import express, { Application, ErrorRequestHandler } from "express";
import morgan from "morgan";
var cors = require("cors");
import { sequelize, getDatabaseInfo, testConnection } from "../database/db";
import "../features/business/clients/client.model";
import "../features/business/product-types/product-type.model";
import "../features/business/products/product.model";
import "../features/business/sales/sale.model";
import "../features/business/product-sales/product-sale.model";
import "../features/business/products/products.associations";
import "../features/business/sales/sales.associations";
import "../features/business/product-sales/product-sales.associations";
// Fase II — Auth con RBAC: primero los seis modelos, después las asociaciones
// (las asociaciones referencian los modelos, no al revés).
import "../features/auth/users/user.model";
import "../features/auth/roles/role.model";
import "../features/auth/resources/resource.model";
import "../features/auth/role-users/role-user.model";
import "../features/auth/resource-roles/resource-role.model";
import "../features/auth/refresh-tokens/refresh-token.model";
import "../features/auth/rbac.associations";
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
    // Fase I — Business
    this.routePrv.clientsRoutes.routes(this.app);
    this.routePrv.productTypesRoutes.routes(this.app);
    this.routePrv.productsRoutes.routes(this.app);
    this.routePrv.salesRoutes.routes(this.app);
    this.routePrv.productSalesRoutes.routes(this.app);

    // Fase II — Auth con RBAC
    this.routePrv.sessionRoutes.routes(this.app);
    this.routePrv.refreshTokensRoutes.routes(this.app);
    this.routePrv.usersRoutes.routes(this.app);
    this.routePrv.rolesRoutes.routes(this.app);
    this.routePrv.resourcesRoutes.routes(this.app);
    this.routePrv.roleUsersRoutes.routes(this.app);
    this.routePrv.resourceRolesRoutes.routes(this.app);
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
EOF
```

![](imagenes/Captura%20de%20pantalla%202026-10-06%20224730.png)

------------------------------------------------------------------------

## Verificación del ISS-01

Comprueba que no hay errores de tipado y lista todos los archivos creados.

``` bash
npx tsc --noEmit
find src -type f | sort
```

![](imagenes/Captura%20de%20pantalla%202026-10-06%20224759.png)

los errores mostrados son por archivos que no se han creado y que se solucionarán siguiendo mas adelante con los issues proximos.

------------------------------------------------------------------------

## Cierre del ISS

Levanta el servidor en modo desarrollo. Debe arrancar sin error. Detenerlo con `Ctrl+C` antes de continuar.

``` bash
npm run dev
```

------------------------------------------------------------------------

## ✅ GATE de la unidad ISS-01

Las condiciones de cierre son exactamente las que define el ISS técnico de esta misma página:

- 📋 Criterios de aceptación → **Criterios de aceptación**
- 🧩 Cierre de la unidad → **Cierre del ISS**
- 🧠 Autoevaluación → Evaluación del cuaderno

Con el GATE en verde queda habilitado **ISS-02 · Infraestructura de base de datos**.

------------------------------------------------------------------------

**Navegación de la ruta:** ← ISS-01 · 🧠 Aprender · ↑ Ruta Express · → ISS-02 · 🧠 Aprender
