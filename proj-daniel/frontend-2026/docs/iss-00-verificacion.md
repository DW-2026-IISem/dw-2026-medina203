# ISS-00 · Requisitos previos — Registro de verificación

**Fecha de ejecución:** 31-oct-2026
**Fase:** 0 · Preparación
**Estado:** ✅ Cumple (con 2 correcciones aplicadas y 2 comprobaciones manuales pendientes)

---

## Rutas reales de este entorno

La guía del docente usa rutas de otra copia del proyecto. En este equipo la ruta
efectiva es:

| Guía (23-oct-2026) | Ruta real en este equipo |
| --- | --- |
| `~/ia-lab/projects/dw/pry-jquintero/front-textilclean-express` | `~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026` |
| `~/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express` | igual (sin cambios) |
| `http://localhost:4000` | `http://localhost:3000` (`.env` → `PORT=3000`) |

> La carpeta del frontend se llama `frontend-2026`, no `front-textilclean-express`.
> Todos los comandos de este documento usan la ruta real.

---

## Tabla de resultados

| Comprobación | Resultado obtenido | ¿Cumple? |
| --- | --- | --- |
| `node -v` | `v24.21.0` (engines: `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0`) | ✅ |
| `npm -v` | `11.19.0` (engines: `^6.11.0 \|\| ^7.5.6 \|\| >=8.0.0`) | ✅ |
| `ng version` | Angular CLI **22.2.5**, Node 24.21.0, npm 11.19.0, linux x64 | ✅ |
| `command -v ng` | `/home/daniel_medina/.nvm/versions/node/v24.21.0/bin/ng` | ✅ (corregido) |
| `curl -i /api/clientes` | `HTTP 401` (backend protegido, `AUTH_ENABLED` sin definir) | ✅ |
| Login admin (tokens) | `access_token` + `refresh_token` + `expires_in: 900` + `refresh_expires_in: 2591999` | ✅ |
| `/api/permisos` admin | **58** permisos, `role_name: ADMIN` | ✅ |
| Login seller (tokens) | `access_token` + `refresh_token` | ✅ |
| `/api/permisos` seller | **7** permisos, `role_name: SELLER` | ✅ |
| `src/` y `package.json` ausentes | `src/` NO · `package.json` NO · `node_modules/` NO | ✅ |
| DevTools (Console + Network) | no verificable por CLI — comprobación manual en el navegador | ⏳ manual |
| Usuario sin rol → 403 | no hay usuario sin rol sembrado con contraseña conocida (ver nota) | ⏳ manual |

---

## 1. Node, npm y Angular CLI

```
node -v        → v24.21.0
npm -v         → 11.19.0
command -v ng  → /home/daniel_medina/.nvm/versions/node/v24.21.0/bin/ng
ng version     → Angular CLI: 22.2.5
```

`npm view @angular/cli version engines --json` (latest al 31-oct-2026):

```json
{
  "version": "22.2.5",
  "engines": {
    "npm": "^6.11.0 || ^7.5.6 || >=8.0.0",
    "node": "^22.22.3 || ^24.15.0 || >=26.0.0",
    "yarn": ">= 1.13.0"
  }
}
```

### Corrección aplicada: `/usr/bin/ng` es el editor Debian, no el CLI

En Ubuntu existe el paquete `ng` (un editor de texto). En shells **no interactivos**
(`bash -lc`, scripts, tareas) `node` no existía y `ng` resolvía a `/usr/bin/ng`,
que abortaba con `panic: aborting due to terminal initialize failure`.

Causa: `~/.bashrc` termina en las primeras líneas si el shell no es interactivo,
así que el bloque de `nvm` nunca se cargaba.

Solución (sin tocar `/usr/bin`, como pide la guía): se añadió la carga de `nvm`
al final de `~/.profile`.

```bash
# ~/.profile
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

Verificación posterior:

```bash
$ bash -lc 'command -v ng; ng version | head -3'
/home/daniel_medina/.nvm/versions/node/v24.21.0/bin/ng
Angular CLI       : 22.2.5
```

---

## 2. Backend en marcha

Proceso activo (verificado por `ss -ltnp` y `/proc/<pid>/cwd`):

```
PID 2832  node .../app-textilclean-express/node_modules/.bin/ts-node src/server.ts
cwd: /home/daniel_medina/ia-lab-academica/proyectos/dw/proj-daniel/app-textilclean-express
LISTEN *:3000
```

| Petición | Resultado |
| --- | --- |
| `GET /api/clientes` | `401` → backend protegido (estado final de entrega) |
| `GET /api/docs` | `301` → `/api/docs/` → `200` (Swagger UI) |
| `GET :4000/api/clientes` | sin respuesta — el backend de esta copia escucha en **3000** |

`npm ci` y `npm run db:seed` **no se re-ejecutaron** a propósito: `node_modules/`
ya está instalado, el seed ya está aplicado y `npm ci` borraría `node_modules`
mientras `nodemon` está corriendo. La evidencia indirecta de que ambos pasos
están hechos es que el servidor arrancó y el catálogo RBAC responde con datos.

`.env` relevante:

```
PORT=3000
DB_ENGINE=mysql
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL_DAYS=30
# AUTH_ENABLED no está definido → modo protegido (401)
```

---

## 3. Login y permisos

### admin / Admin123!

```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "SOr3...",
  "refresh_expires_in": 2591999
}
```

- `GET /api/sesion/perfil` → `200`
  `{"user":{"id":1,"username":"admin","email":"admin@textilclean.local","avatar":null,"status":"active"}}`
- `GET /api/permisos` → **58** filas, todas con `role_name: "ADMIN"`.

> `refresh_expires_in` es `2591999` (30 días, `JWT_REFRESH_TTL_DAYS=30`), no `604800`
> como en el ejemplo de la guía.

### seller / Seller123!

`GET /api/permisos` → **7** filas, todas con `role_name: "SELLER"`:

| Método | Ruta |
| --- | --- |
| GET | `/api/clientes` |
| GET | `/api/clientes/:id` |
| GET | `/api/productos` |
| GET | `/api/productos/:id` |
| GET | `/api/ventas` |
| GET | `/api/ventas/:id` |
| POST | `/api/ventas` |

### Matriz RBAC comprobada

| Petición | HTTP |
| --- | --- |
| admin `GET /api/clientes` | `200` |
| seller `GET /api/clientes` | `200` |
| seller `GET /api/usuarios` | `403` |
| seller `POST /api/clientes` | `403` |
| sin token `GET /api/clientes` | `401` |
| sin token `GET /api/permisos` | `401` |

**Catálogo real de recursos** (distinto de la prosa de la guía, que menciona
pedidos / inventario / proveedores / categorías):

`clientes`, `productos`, `ventas`, `detalle-ventas`, `tipos-producto`,
`usuarios`, `roles`, `recursos`, `asignaciones-rol`, `concesiones-rol`.

---

## 4. Usuarios sembrados

| Usuario | Contraseña | Rol | Permisos |
| --- | --- | --- | --- |
| `admin` | `Admin123!` | ADMIN | 58 |
| `seller` | `Seller123!` | SELLER | 7 |
| `andre` | desconocida | `auditor` | por revisar |
| `daniel` | desconocida | `EDITOR` | por revisar |

No existe actualmente un usuario **sin rol** con contraseña conocida, por lo que
la comprobación “autenticado sin rol → 403” no se pudo ejecutar con credenciales
reales. El equivalente funcional sí quedó demostrado: un token válido sin la
concesión `(method, path)` recibe `403` (ver fila `seller GET /api/usuarios`).

Si se quiere reproducir el caso exacto, con el token de admin:

```bash
curl -s -X POST http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"username":"sinrol","email":"sinrol@example.com","password":"SinRol123!"}'
```

y luego, sin asignarle rol, comprobar `GET /api/clientes` → `403`.

---

## 5. Navegador y herramientas

Pendiente de comprobación manual (no verificable por CLI):

1. Abrir `http://localhost:4200` cuando exista el proyecto (ISS-01).
2. `F12` → Console + Network; confirmar `Authorization: Bearer ...` en cada petición.
3. Instalar Angular DevTools (opcional).
4. Desactivar bloqueadores que intercepten `localhost`.

---

## 6. Estructura de trabajo

```
~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
├── docs/            (vacío, listo para la documentación de los ISS)
└── .               (sin src/, sin package.json, sin node_modules/, sin .git)
```

- `src/` → NO
- `package.json` → NO
- `node_modules/` → NO
- `.git` → NO (el proyecto aún no es repositorio git)

### Corrección aplicada: permisos de `docs/`

`docs/` estaba creado como `root:root 755`, por lo que `daniel_medina` no podía
escribir la documentación de los ISS. Se corrigió:

```bash
sudo chown daniel_medina:daniel_medina \
  ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026/docs
```

Estado actual: `daniel_medina:daniel_medina 755`, escritura verificada.

---

## Desviaciones de la guía (detectadas)

| # | Guía dice | Realidad | Acción |
| --- | --- | --- | --- |
| 1 | carpeta `front-textilclean-express` en `~/ia-lab/projects/dw/pry-jquintero/` | `frontend-2026` en `~/ia-lab-academica/proyectos/dw/proj-daniel/` | se usa la ruta real |
| 2 | backend en `localhost:4000` | `localhost:3000` (`PORT=3000`) | se usa 3000 |
| 3 | paso 5 de la verificación: `ls -la .../app-textilclean-express` | apunta al backend, no al frontend | se usa `.../frontend-2026` |
| 4 | `/api/permisos` con clientes, pedidos, productos, inventario, proveedores, categorías | clientes, productos, ventas, detalle-ventas, tipos-producto + administración | se ajusta al catálogo real (58 / 7) |
| 5 | `refresh_expires_in: 604800` | `2591999` (30 días) | se documenta el valor real |
| 6 | `/api/docs` responde 200 directo | `301` → `/api/docs/` → `200` | normal en Swagger UI |

---

## Cierre

- ✅ 0.1 Node, npm y Angular CLI verificados.
- ✅ 0.2 Backend escuchando en 3000 con BD conectada y catálogo sembrado.
- ✅ 0.3 Login admin con tokens y 58 permisos.
- ✅ 0.4 Login seller con 7 permisos; RBAC responde 403 donde corresponde.
- ⏳ 0.5 DevTools: comprobación manual en el navegador.
- ✅ 0.6 Carpeta del frontend vacía de código (solo `docs/`).

Siguiente: **ISS-01 — Bootstrap Angular 22 con CLI**, ejecutado desde
`~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026` con
`ng new front-textilclean-express --directory .`
