------------------------------------------------------------------------

# 🛠 ISS-00 · Requisitos previos — Fase 0: Preparación

> **Proyecto frontend:** `front-textilclean-express` **Proyecto backend:** `app-textilclean-express` (Express 5 + TypeScript + Sequelize 6) **Fase:** 0 · Preparación · **Bloqueado por:** ninguno · **Habilita:** ISS-01 **Vigencia:** revisión alineada con guía del docente del 23-oct-2026. **Capa:** 🛠 Construir (ejecutar, verificar y entregar)

------------------------------------------------------------------------

## Contexto mínimo (autosuficiente)

esto es lo que hay que saber antes de ejecutarlo:

- **Proyecto:** `front-textilclean-express` — Angular 22 (standalone + signals), PrimeNG 22 en modo *styled* con tema Aura y Tailwind CSS 4. Sin CSS propio ni PrimeFlex.
- **Backend de referencia:** `app-textilclean-express` — Express 5 + TypeScript + Sequelize, arquitectura por features. Sus ISS están en `docs/construir/` y el cuaderno en `docs/aprender/`.
- **Recorrido obligatorio de una petición:** `Componente → Service → HttpClient → Interceptor → API → Controller → Service → Repository → Model → BD`. La UI no conoce Sequelize ni la base de datos.
- **Contrato REST (endpoints, respuestas y códigos):** `../README.md#contrato-rest-del-backend`.
- **Patrón visual y convenciones:** `PATRON-VISUAL.md`.

### Este ISS

| Campo           | Valor                                 |
|-----------------|---------------------------------------|
| Título          | Requisitos previos                    |
| Feature / tabla | —                                     |
| API             | —                                     |
| Depende de      | ninguno (es el primero)               |
| Habilita        | ISS-01 — Bootstrap Angular 22 con CLI |

### Objetivo

Dejar el equipo listo para construir el frontend de **TextilClean**: Node, npm, Angular CLI, navegador, backend Express corriendo y base de datos sembrada. **Al terminar este ISS no se ha escrito código de Angular todavía; solo se comprueba el entorno.**

### Evidencia de aprendizaje

Al cierre debes poder explicar: 1. **Qué ejecuta WSL** (Node, npm, CLI, backend, seed) y **qué abre el navegador de Windows** (`http://localhost:4200`, `http://localhost:4000/api/docs`). 2. Por qué el login devuelve **solo tokens** y no el usuario.

------------------------------------------------------------------------

## Criterios de aceptación (ISS-00) — consolidados

- [ ] **0.1** `node -v` cumple los `engines` del CLI consultado y `npm -v` responde.
- [ ] **0.1** `ng version` identifica Angular CLI 22.x (y **no otro programa llamado `ng`**).
- [ ] **0.1** `command -v ng` apunta a la instalación npm.
- [ ] **0.2** `npm run db:seed` termina sin error y `npm run dev` deja el puerto **4000** escuchando.
- [ ] **0.3** `POST /api/sesion/login` con `admin / Admin123!` devuelve `access_token` y `refresh_token`.
- [ ] **0.3** `GET /api/permisos` con ese token devuelve `permissions` (conteo según catálogo del rol ADMIN de TextilClean).
- [ ] **0.4** `seller / Seller123!` inicia sesión y `/api/permisos` devuelve el subconjunto SELLER de TextilClean.
- [ ] **0.5** DevTools con **Console** y **Network** disponibles para revisar cada petición.
- [ ] **0.6** La carpeta del frontend existe y está vacía de código: **sin `src/` ni `package.json`**; solo `docs/` y configuración del repositorio.
- [ ] `curl -i http://localhost:4000/api/clientes` responde **401** (backend final) o **200** (backend en Fase I / `AUTH_ENABLED=false`).

------------------------------------------------------------------------

## 0.1 Node, npm y Angular CLI

### Criterios de este sub-ítem

- [ ] `node -v` cumple `engines.node` de `@angular/cli`.
- [ ] `npm -v` cumple `engines.npm`.
- [ ] `ng version` muestra **Angular CLI 22.x**.
- [ ] `command -v ng` apunta a la instalación npm y **no** a otro programa.

### Pasos (en Ubuntu WSL, antes de crear el proyecto)

``` bash
node --version
npm --version
npm view @angular/cli version engines --json
npm install -g @angular/cli
ng version
```

### Notas importantes

- `npm install -g @angular/cli` instala la versión publicada como `latest`, **sin fijar una versión mayor**. No se escribe `@22` ni se usa `npx` en el recorrido principal.
- Si el CLI ya está instalado, `ng version` permite comprobarlo antes de decidir actualizar.
- Usa un **Node compatible con `engines`** del paquete consultado. **No uses `--force`** para ignorar incompatibilidades.
- `ng version` debe mostrar **Angular CLI**. En algunos Ubuntu existe otro programa llamado `ng`: comprueba `command -v ng` si abre un editor o falla antes de mostrar el CLI. **No cambies archivos de `/usr/bin`**; revisa el `PATH` y la instalación npm.

### Verificación esperada (ejemplo de la guía)

La consulta del 23-oct-2026 reportó `engines.node` `^22.22.3 || ^24.15.0 || >=26.0.0`. El workspace de referencia usó Node 24.20.0, npm 11.19.1 y CLI 22.2.4. **Son datos de la copia existente, no una orden para fijar la versión de una instalación nueva.** Si `latest` cambia de versión mayor, vuelve a revisar compatibilidad con PrimeNG y los flags antes de usar el material sin ajustes.

> **PARCHE — antes de ISS-01:** todavía no existe `package.json` en el frontend, así que `npm run ng` **no aplica** en este ISS. La comprobación del CLI local se hace en ISS-01, después de `ng new`. Aquí basta con el **CLI global** de `ng version`.

------------------------------------------------------------------------

## 0.2 Backend en marcha (preparación para integrar HTTP)

### Criterios de este sub-ítem

- [ ] `npm ci` (o `npm install` si es la primera vez) termina sin error.
- [ ] `npm run db:seed` termina sin error.
- [ ] `npm run dev` deja el puerto **4000** escuchando.
- [ ] El log muestra conexión a la BD y `sync` exitoso.
- [ ] `curl -i http://localhost:4000/api/clientes` responde **401** (protegido) o **200** (Fase I / `AUTH_ENABLED=false`).

### Pasos

``` bash
cd ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express
npm ci
npm run db:seed
npm run dev
```

Debe aparecer algo como:

```         
🔗 Intentando conectar a: MYSQL
📦 Base de datos sincronizada exitosamente
🚀 Servidor ejecutándose en puerto 4000
```

> ⚠️ **Advertencia:** no ejecutes `db:seed` sobre una base con datos que deban conservarse. El seeder reconcilia catálogos y omite las entidades que ya tienen registros, pero **es una operación sobre la base real del laboratorio**.

Si falla la conexión, revisa `.env` (`DB_ENGINE`, `MYSQL_*` o `POSTGRES_*`) y que el motor esté escuchando. **El backend no arranca sin base de datos.**

### Las tres modalidades del backend (TextilClean)

| Modalidad | Qué exige | Ejemplos |
|----|----|----|
| **OPEN** | nada | `POST /api/sesion/login`, `/refresh`, `/logout`, `/api/docs` |
| **JWT** | access token válido | `GET /api/sesion/perfil`, `GET /api/permisos`, `/api/sesiones/*` |
| **JWT + RBAC** | token + concesión `(method, path)` | CRUD de negocio (`/api/clientes`, `/api/pedidos`, `/api/productos`, `/api/inventario`, `/api/proveedores`, `/api/categorias`) y administración |

### Importante para la Fase I

En el backend final de `app-textilclean-express` las rutas de negocio ya llevan `authenticate + authorize`. Por eso el frontend de la Fase I se construye de **una de estas tres formas**:

1.  Contra la versión del backend **antes de ISS-13** (rutas sin middlewares).
2.  Contra un **stub** con el mismo contrato.
3.  Contra el backend consolidado con **`AUTH_ENABLED=false`** (deja OPEN solo las 5 rutas de negocio).

Al comenzar la Fase II (ISS-08) hay que **emparejar los dos interruptores**: - Frontend: `requireAuth = true` - Backend: `AUTH_ENABLED=true` en el `.env`

### Comprobación de la matriz de permisos

``` bash
curl -i http://localhost:3000/api/clientes
```

| Resultado | Significado |
|----|----|
| `401 Unauthorized` | backend **protegido** (estado final y de entrega). Correcto. |
| `200` con `{ "clients": [...] }` | backend en modo laboratorio (`AUTH_ENABLED=false`) o copia anterior a ISS-13. |
| `ECONNREFUSED` | el backend **no está escuchando** en el puerto 4000. |

------------------------------------------------------------------------

## 0.3 Login y permisos

### Criterios de este sub-ítem

- [ ] El login (OPEN) devuelve `access_token`, `refresh_token`, `expires_in` y `refresh_expires_in`.
- [ ] `GET /api/sesion/perfil` (JWT) devuelve `{ user }`.
- [ ] `GET /api/permisos` (JWT) devuelve una fila por permiso efectivo.
- [ ] `admin` obtiene el catálogo completo de permisos de TextilClean.

### Pasos

``` bash
# 1. Login (OPEN)
curl -s -X POST http://localhost:3000/api/sesion/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"Admin123!"}'
```

Respuesta esperada:

``` json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "9f2c...",
  "refresh_expires_in": 604800
}
```

``` bash
# 2. Perfil (JWT)
curl -s http://localhost:3000/api/sesion/perfil \
  -H "Authorization: Bearer $TOKEN"

# 3. Permisos efectivos (JWT)
curl -s http://localhost:3000/api/permisos \
  -H "Authorization: Bearer $TOKEN"
```

`GET /api/permisos` devuelve una fila por permiso efectivo:

``` json
{
  "permissions": [
    {
      "resource_id": 1,
      "method": "GET",
      "path": "/api/clientes",
      "description": "Listar clientes",
      "role_id": 1,
      "role_name": "ADMIN"
    }
  ]
}
```

Esa forma es la que consumirá **`SessionStore` en ISS-08**. El frontend **no** recibe `user`, `roles` ni `resources` en el login.

------------------------------------------------------------------------

## 0.4 Credenciales del seeder

### Criterios de este sub-ítem

- [ ] `admin / Admin123!` inicia sesión y recibe el catálogo completo de permisos de TextilClean.
- [ ] `seller / Seller123!` inicia sesión y recibe el subconjunto SELLER de TextilClean.
- [ ] Un **usuario sin rol** se autentica pero recibe **403** en recursos RBAC.

| Usuario | Password | Rol | Permisos esperados (TextilClean) |
|----|----|----|----|
| `admin` | `Admin123!` | ADMIN | catálogo completo (clientes, pedidos, productos, inventario, proveedores, categorías) |
| `seller` | `Seller123!` | SELLER | subconjunto de lectura (clientes, pedidos, productos) |

> Ajusta el **conteo exacto** al catálogo real sembrado en `app-textilclean-express`. El seeder crea además **usuarios aleatorios sin rol**: sirven para comprobar que estar autenticado no basta (recibirán `403`).

Los permisos **no** están hardcodeados en el frontend: salen de `/api/permisos`, que ejecuta la misma consulta que el middleware `authorize` (`role_users → roles → resource_roles → resources`, todos los eslabones activos).

------------------------------------------------------------------------

## 0.5 Navegador y herramientas

### Criterios de este sub-ítem

- [ ] DevTools (F12) con **Console** y **Network** disponibles.
- [ ] Las peticiones permiten comprobar `Authorization: Bearer ...`.
- [ ] No hay bloqueadores que intercepten `localhost`.

### Pasos

1.  Abre DevTools (`F12`) → **Console** y **Network**. En cada ISS comprobarás que las peticiones llevan `Authorization: Bearer ...`.
2.  Instala **Angular DevTools** (opcional) para inspeccionar componentes y signals.
3.  Desactiva bloqueadores que intercepten `localhost` si el login falla sin motivo.

------------------------------------------------------------------------

## 0.6 Estructura de trabajo

### Criterios de este sub-ítem

- [ ] La carpeta del frontend existe.
- [ ] **No contiene `src/` ni `package.json`** antes de ISS-01.
- [ ] Solo contiene `docs/` y archivos de configuración del repositorio.

### Pasos

El proyecto se crea **dentro** de la carpeta existente:

```         
~/ia-lab/projects/dw/pry-jquintero/front-textilclean-express
```

**No se debe crear una subcarpeta adicional.** En **ISS-01** se explica el comando exacto:

``` bash
ng new front-textilclean-express --directory .
```

y por qué `ng new .` falla en Angular CLI 22.

### Workspace

Todas las ISS usan este proyecto: carpeta `app-textilclean-express` en `ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express`. **Antes de cada bloque de comandos, haz `cd` a esa ruta.**

------------------------------------------------------------------------

## Verificación del ISS

Ejecuta esta secuencia completa para confirmar el cierre:

``` bash
# 1. Versiones
node -v && npm -v && ng version


# 2. Backend vivo (401 = protegido, 200 = Fase I)
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/api/clientes

# 3. Login + permisos de admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/sesion/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"Admin123!"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

curl -s http://localhost:3000/api/permisos \
  -H "Authorization: Bearer $TOKEN" | head -c 300

# 4. Permisos de seller
STOKEN=$(curl -s -X POST http://localhost:3000/api/sesion/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"seller","password":"Seller123!"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

curl -s http://localhost:3000/api/permisos \
  -H "Authorization: Bearer $STOKEN" | head -c 300

# 5. Estructura del frontend (sin código todavía)
ls -la ~/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express
```

### Tabla de resultados a registrar (llénala con tu ejecución)

| Comprobación                     | Resultado obtenido | ¿Cumple? |
|----------------------------------|--------------------|----------|
| `node -v`                        |                    | ☐        |
| `npm -v`                         |                    | ☐        |
| `ng version`                     |                    | ☐        |
| `command -v ng`                  |                    | ☐        |
| `curl -i /api/clientes`          |                    | ☐        |
| Login admin (tokens)             |                    | ☐        |
| `/api/permisos` admin (conteo)   |                    | ☐        |
| Login seller (tokens)            |                    | ☐        |
| `/api/permisos` seller (conteo)  |                    | ☐        |
| `src/` y `package.json` ausentes |                    | ☐        |

> Los resultados de la **copia de referencia** del docente (23-oct-2026) fueron: Node `v24.20.0`, npm `11.19.1`, Angular CLI `22.2.4`, `/api/clientes` → `401`, admin → tokens + permisos completos, seller → tokens + subconjunto, sin `src/` ni `package.json`. **Son datos de la fuente, no pruebas repetidas en tu entorno.**

------------------------------------------------------------------------

## Cierre del ISS

Entorno listo. **No hay código que compilar todavía**: el primer archivo de Angular se crea en **ISS-01**.

- Mantén el backend en ejecución en una terminal aparte para las ISS que consumen HTTP (**ISS-03 en adelante**).
- **ISS-01**, **ISS-01A** e **ISS-01B** **no necesitan** el backend corriendo.
- El recorrido visual de ISS-01 a ISS-01B no depende de la verificación HTTP de este ISS.

### Correspondencia con el código

Este ISS **no produce archivos de `src/`**. Las comprobaciones se hacen con los comandos anteriores y con el backend de referencia. El primer archivo consolidado es `package.json`, que se crea en **ISS-01**; hasta entonces **no existen enlaces a `src/`**.

------------------------------------------------------------------------

## Navegación de la ruta

⬅️ **Anterior:** — (es el primer ISS) ⬆️ **Ruta:** Frontend-Express · Fase 0 — Preparación ➡️ **Siguiente:** ISS-01 — Bootstrap Angular 22 con CLI
