-- =====================================================================================
--  TEXTILCLEAN EXPRESS — Script DBeaver (MySQL / BD: tecnogua)
--  Objetivo: crear un NUEVO ROL, un NUEVO USUARIO, asignarle el rol, concederle
--            el BUSINESS (módulo de negocio) que elijas y validar la AUTENTICACIÓN.
--
--  Tablas que usa (según los modelos del proyecto):
--      roles           -> rol nuevo
--      users           -> usuario nuevo (password bcrypt cost 12)
--      role_users      -> usuario  -> rol          (asignación)
--      resources       -> catálogo de endpoints    (por business: clientes, productos, ...)
--      resource_roles  -> rol -> recurso           (concesión/permiso RBAC)
--      refresh_tokens  -> se llena al hacer login real por la API
--
--  Cómo ejecutarlo en DBeaver: abrir el archivo y Ctrl+Alt+X (Execute SQL Script).
--  IMPORTANTE: lee el PASO 0 (solo hay 1 paso manual: el hash bcrypt).
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- PASO 0 — PARÁMETROS (edita aquí lo que quieras)
-- -------------------------------------------------------------------------------------
-- Alinea la collation de la sesión con la de las tablas (evita el Error 1267
-- "Illegal mix of collations (utf8mb4_unicode_ci,IMPLICIT) and (utf8mb4_0900_ai_ci,IMPLICIT)")
-- Las columnas fueron creadas por Sequelize con utf8mb4_unicode_ci, pero la conexión
-- de MySQL 8 entra por defecto con utf8mb4_0900_ai_ci.
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @rol_name        = 'VENTAS_CLIENTES';             -- nombre del rol nuevo (se guarda en MAYÚSCULAS)
SET @rol_description = 'Atención de clientes y ventas del negocio de clientes';

SET @username        = 'vendedor.clientes';            -- usuario nuevo (minúsculas, como lo exige el modelo)
SET @email           = 'vendedor.clientes@textilclean.local';
SET @password_plain  = 'Vendedor123!';                 -- clave en texto plano (para probar el login)

-- BUSINESS a conceder (el que quieras): 'clientes' | 'tipos-producto' | 'productos' | 'ventas' | 'detalle-ventas'
SET @business        = 'clientes';
SET @business_prefix = CONCAT('/api/', @business);

-- ***** PASO ÚNICO MANUAL: el hash bcrypt (MySQL NO puede calcular bcrypt) *****
-- Genera el hash (cost 12, igual que src/shared/auth/password.ts) desde la carpeta del proyecto:
--     node -e "require('bcryptjs').hash('Vendedor123!',12).then(h=>console.log(h))"
-- y pega el resultado entre comillas abajo. Si no lo haces, el login devolverá 401.
SET @password_hash   = 'PEGA_AQUI_EL_HASH_BCRYPT';

-- Comprobación del hash (DEBE decir "HASH OK" antes de ejecutar el PASO 4):
SELECT IF(LENGTH(@password_hash) >= 59
          AND @password_hash LIKE '$2%'
          AND @password_hash <> 'PEGA_AQUI_EL_HASH_BCRYPT',
          'HASH OK', 'DETENER: falta generar el hash bcrypt (ver PASO 0)') AS estado_hash;

-- -------------------------------------------------------------------------------------
-- PASO 1 — PRE-VALIDACIÓN DE LA BASE (estructura y businesses disponibles)
-- -------------------------------------------------------------------------------------
-- 1.0 Collations reales de las tablas (la columna `collation_name` debe ser utf8mb4_unicode_ci):
SELECT table_name, column_name, collation_name
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name IN ('roles','users','role_users','resources','resource_roles')
  AND data_type IN ('varchar','enum')
ORDER BY table_name, column_name;

-- 1.1 Las 5 tablas deben aparecer con 5 filas:
SELECT table_name AS tabla
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN ('roles','users','role_users','resources','resource_roles','refresh_tokens')
ORDER BY table_name;

-- 1.2 Businesses disponibles (módulos de negocio) y sus endpoints sembrados por RESOURCE_CATALOG:
SELECT TRIM(LEADING '/' FROM SUBSTRING_INDEX(path, '/', 3)) AS business,
       COUNT(*)                                            AS endpoints,
       GROUP_CONCAT(DISTINCT status ORDER BY status)       AS estados
FROM resources
GROUP BY business
ORDER BY business;

-- 1.3 Detalle del business elegido (los endpoints que recibirá el rol):
SELECT id, method, path, description, status
FROM resources
WHERE path LIKE CONCAT(@business_prefix, '%')
ORDER BY id;

-- -------------------------------------------------------------------------------------
-- PASO 2 — VERIFICACIÓN DE CHOQUES (rol/usuario nuevos no deben existir)
-- -------------------------------------------------------------------------------------
SELECT (SELECT COUNT(*) FROM roles   WHERE name = UPPER(TRIM(@rol_name)))      AS roles_duplicados,
       (SELECT COUNT(*) FROM users   WHERE username = LOWER(@username)
                                    OR email = LOWER(@email))                  AS usuarios_duplicados;
-- Esperado: 0 y 0. Si sale > 0, cambia los parámetros del PASO 0.

-- -------------------------------------------------------------------------------------
-- PASO 3 — CREAR EL NUEVO ROL  (tabla: roles)
--          Ojo: el DEFAULT de status es 'inactive', y la autorización exige 'active'.
-- -------------------------------------------------------------------------------------
INSERT INTO roles (name, description, status, createdAt, updatedAt)
SELECT UPPER(TRIM(@rol_name)),
       @rol_description,
       'active',
       NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = UPPER(TRIM(@rol_name)));

-- Verificación del rol creado:
SELECT id, name, description, status, createdAt
FROM roles
WHERE name = UPPER(TRIM(@rol_name));

SET @role_id = (SELECT id FROM roles WHERE name = UPPER(TRIM(@rol_name)));

-- -------------------------------------------------------------------------------------
-- PASO 4 — CREAR EL NUEVO USUARIO  (tabla: users)
--          password debe ser hash bcrypt (cost 12); status 'active' (si no: 401 en login).
--          username/email en minúsculas (hook beforeValidate del modelo User).
-- -------------------------------------------------------------------------------------
INSERT INTO users (username, email, password, avatar, status, createdAt, updatedAt)
SELECT LOWER(TRIM(@username)),
       LOWER(TRIM(@email)),
       @password_hash,
       NULL,
       'active',
       NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users
                  WHERE username = LOWER(TRIM(@username))
                     OR email    = LOWER(TRIM(@email)));

SELECT ROW_COUNT() AS filas_insertadas_en_users;   -- DEBE ser 1 (0 = usuario ya existía)

-- Verificación del usuario (el password NO se debe mostrar en claro, solo el hash):
SELECT id, username, email, status,
       LEFT(password, 7)  AS hash_inicio,   -- debe verse tipo "$2a$12$"
       LENGTH(password)   AS hash_largo,    -- >= 59
       createdAt
FROM users
WHERE username = LOWER(TRIM(@username));

SET @user_id = (SELECT id FROM users WHERE username = LOWER(TRIM(@username)));

-- -------------------------------------------------------------------------------------
-- PASO 5 — ASIGNAR EL NUEVO ROL AL USUARIO  (tabla: role_users)
--          status 'active' porque findEffectiveForUser() filtra role_users.status = 'active'
-- -------------------------------------------------------------------------------------
INSERT INTO role_users (user_id, role_id, status, createdAt, updatedAt)
SELECT @user_id, @role_id, 'active', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM role_users
                  WHERE user_id = @user_id AND role_id = @role_id);

-- Verificación de la asignación usuario -> rol:
SELECT ru.id, u.username, r.name AS rol, ru.status
FROM role_users ru
JOIN users   u ON u.id = ru.user_id
JOIN roles   r ON r.id = ru.role_id
WHERE ru.user_id = @user_id AND ru.role_id = @role_id;

-- -------------------------------------------------------------------------------------
-- PASO 6 — ELEGIR EL BUSINESS: conceder los endpoints de ese módulo al rol
--          (tabla: resource_roles  = permisos RBAC del rol)
--          Cambia @business en el PASO 0 y vuelve a ejecutar este paso para otro módulo.
-- -------------------------------------------------------------------------------------
INSERT INTO resource_roles (role_id, resource_id, status, createdAt, updatedAt)
SELECT @role_id, res.id, 'active', NOW(), NOW()
FROM resources res
WHERE res.path LIKE CONCAT(@business_prefix, '%')
  AND NOT EXISTS (SELECT 1 FROM resource_roles rr
                  WHERE rr.role_id = @role_id AND rr.resource_id = res.id);

SELECT ROW_COUNT() AS concesiones_creadas;

-- Verificación de las concesiones rol -> business:
SELECT rr.id, r.name AS rol, res.method, res.path, res.description,
       res.status AS recurso_status, rr.status AS concesion_status
FROM resource_roles rr
JOIN roles     r   ON r.id  = rr.role_id
JOIN resources res ON res.id = rr.resource_id
WHERE rr.role_id = @role_id
ORDER BY res.id;

-- -------------------------------------------------------------------------------------
-- PASO 7 — PERMISO EFECTIVO (replica exactamente findEffectiveForUser() que usa
--          el middleware authorize): usuario + rol activo + concesión activa + recurso activo
-- -------------------------------------------------------------------------------------
SELECT r.name AS role_name, res.method, res.path, res.description
FROM resource_roles rr
JOIN roles       r   ON r.id  = rr.role_id  AND r.status   = 'active'
JOIN role_users  ru  ON ru.role_id = r.id   AND ru.status  = 'active'
JOIN resources   res ON res.id = rr.resource_id AND res.status = 'active'
WHERE rr.status = 'active'
  AND ru.user_id = @user_id
ORDER BY rr.id;

-- Recursos del business que estén INACTIVOS (si hay, ese endpoint daría 403 igualmente):
SELECT id, method, path, status
FROM resources
WHERE path LIKE CONCAT(@business_prefix, '%') AND status <> 'active';

-- -------------------------------------------------------------------------------------
-- PASO 8 — AUTENTICACIÓN CON EL NUEVO USUARIO
-- -------------------------------------------------------------------------------------
-- 8.1 Simulación en SQL de lo que hace la app en POST /api/sesion/login
--     (SessionService.login -> findByIdentifierWithPassword + status = 'active').
--     La comparación de la clave es bcrypt y SOLO puede hacerla la API (no MySQL).
SELECT u.id, u.username, u.email, u.status,
       CASE
         WHEN u.id IS NULL                  THEN '401 Invalid credentials (usuario no existe)'
         WHEN u.status <> 'active'          THEN '401 Invalid credentials (usuario inactivo)'
         WHEN u.password NOT LIKE '$2%'     THEN '401 Invalid credentials (hash invalido)'
         ELSE 'PRECONDICIONES DE LOGIN OK (falta comparar bcrypt en la API)'
       END AS login_sql
FROM (SELECT id, username, email, status, password
      FROM users
      WHERE username = LOWER(TRIM(@username))
         OR email    = LOWER(TRIM(@email)) ) u;

-- 8.2 >>> LOGIN REAL (fuera de DBeaver) — endpoint definido en SessionRoutes:
--      POST http://localhost:3000/api/sesion/login
--      Content-Type: application/json
--
--      {
--        "identifier": "vendedor.clientes",      -- puede ser username o email
--        "password":   "Vendedor123!"
--      }
--
--      curl -X POST http://localhost:3000/api/sesion/login \
--          -H "Content-Type: application/json" \
--          -d '{"identifier":"vendedor.clientes","password":"Vendedor123!"}'
--
--      Respuesta esperada (200):
--      {
--        "access_token":  "eyJhbGciOi...",
--        "token_type":    "Bearer",
--        "expires_in":    900,
--        "refresh_token": "...",
--        "refresh_expires_in": 2592000
--      }
--      Errores: 401 Invalid credentials (clave mal o usuario inactivo).

-- 8.3 Verificación POST-LOGIN en BD: la sesión queda registrada en refresh_tokens
--     (ejecutar después del login real):
SELECT rt.id, u.username, rt.family_id, rt.device_info,
       rt.expires_at, rt.status, rt.createdAt
FROM refresh_tokens rt
JOIN users u ON u.id = rt.user_id
WHERE rt.user_id = @user_id
ORDER BY rt.id DESC
LIMIT 5;

-- 8.4 Uso del token contra el business elegido (debe responder 200, no 403):
--      curl -X GET http://localhost:3000/api/clientes \
--          -H "Authorization: Bearer <access_token del paso 8.2>"

-- -------------------------------------------------------------------------------------
-- PASO 9 — RESUMEN FINAL
-- -------------------------------------------------------------------------------------
SELECT @username                          AS usuario,
       @email                             AS email,
       (SELECT name FROM roles   WHERE id = @role_id)   AS rol,
       @business                          AS business,
       (SELECT COUNT(*) FROM resource_roles WHERE role_id = @role_id AND status = 'active') AS endpoints_concedidos,
       (SELECT COUNT(*) FROM role_users     WHERE user_id = @user_id  AND status = 'active') AS roles_asignados,
       (SELECT status FROM users WHERE id = @user_id)   AS estado_usuario;

-- -------------------------------------------------------------------------------------
-- (OPCIONAL) ROLLBACK — deshacer todo lo creado por este script
-- -------------------------------------------------------------------------------------
-- DELETE FROM resource_roles WHERE role_id = @role_id;
-- DELETE FROM role_users     WHERE user_id = @user_id AND role_id = @role_id;
-- DELETE FROM refresh_tokens WHERE user_id = @user_id;
-- DELETE FROM users          WHERE id = @user_id;
-- DELETE FROM roles          WHERE id = @role_id;
