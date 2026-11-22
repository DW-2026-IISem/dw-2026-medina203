# ISS-02 · Infraestructura de base de datos — TextilClean

**Bloqueado por:** ISS-01. **Habilita:** ISS-03.

## Objetivo

Conectar Express con la base de datos `textilclean_db` usando Sequelize, con el
motor elegido por variable de entorno.

## Comandos

```bash
npm install sequelize@^6 mysql2 pg pg-hstore tedious oracledb
cp .env.example .env     # ajustar MYSQL_USER / MYSQL_PASSWORD
npm run dev
```

## Archivos

| Archivo | Responsabilidad |
|---|---|
| `.env.example` | `PORT`, `DB_ENGINE`, `DB_SYNC_FORCE` y bloques MySQL/PostgreSQL/SQL Server/Oracle |
| `src/database/db.ts` | Exporta `sequelize`, `getDatabaseInfo()` y `testConnection()` |
| `src/config/index.ts` | `dbConnection()`: autentica y ejecuta `sync` antes de abrir el puerto |
| `src/database/seeders/` | Reservada para ISS-04 |

- Solo `mysql` y `postgres` tienen adaptador; otro valor de `DB_ENGINE` lanza
  *"Motor de base de datos no soportado"*.
- `.env` no se versiona (está en `.gitignore`); el repo solo trae `.env.example`.

> ⚠️ `sync({ alter })` no es una migración de producción. Con `DB_SYNC_FORCE=true`
> se borran y recrean las tablas.

## Salida esperada de `npm run dev`

```
🔗 Conectando a mysql://root@localhost:3306/textilclean_db
✅ Conexión exitosa a MYSQL
📦 Base de datos sincronizada
🚀 TextilClean API en el puerto 4000
```

## Criterios de aceptación

- [x] Paquetes instalados y `.env.example` con `DB_ENGINE` y bloques de motores
- [x] `db.ts` con los tres exports
- [x] Carpeta `seeders/` sin lógica
- [x] `npx tsc --noEmit` sin errores
- [x] `npm run dev` conecta con `DB_ENGINE=mysql`
