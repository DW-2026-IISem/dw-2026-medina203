# ISS-00 · Requisitos previos — TextilClean

**Fase I:** Business (sin auth). **Habilita:** ISS-01.

## Objetivo

Dejar listo el entorno para construir el backend de TextilClean y fijar el
modelo de dominio antes de escribir código.

## Herramientas

| Herramienta | Versión mínima | Verificación |
|---|---|---|
| Node.js | 22 LTS | `node -v` |
| npm | 10 | `npm -v` |
| Git | 2.40 | `git --version` |
| MySQL | 8.0 (o PostgreSQL 15) | `mysql --version` |
| VS Code + REST Client | — | abrir un archivo `.http` |

## Base de datos

```sql
CREATE DATABASE textilclean_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Modelo de dominio (decisión de diseño)

La guía usa una tienda (clientes, tipos de producto, productos, ventas y detalle).
TextilClean **no vende productos**: presta servicios de lavado. Por eso las tablas son:

| Guía | TextilClean | Motivo |
|---|---|---|
| clients | `customers` | Los clientes son empresas (NIT, razón social, contacto) |
| product_types | `garment_types` | Lo que se clasifica es la prenda |
| products | `laundry_services` | Se cobra un servicio por kg o por unidad, sin stock |
| sales | `service_orders` | La orden tiene fecha de recepción, entrega y estado de proceso |
| product_sales | `service_order_items` | Cada línea guarda cantidad, peso y precio congelado |

Reglas generales:

- Todas las tablas usan `status` (`active`/`inactive`) para el borrado lógico.
- Los nombres de tablas y campos están en inglés; las rutas HTTP en español.

## Criterios de aceptación

- [ ] Node, npm, Git y MySQL instalados y verificados
- [ ] Base de datos `textilclean_db` creada
- [ ] Modelo de dominio documentado (este archivo)
