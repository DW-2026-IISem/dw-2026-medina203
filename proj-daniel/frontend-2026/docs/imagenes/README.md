# Evidencias de ejecución

Carpeta de capturas de pantalla usadas en `docs/proceso.md` y en los registros
`docs/iss-*-verificacion.md`.

## Convención de nombres

```
iss-<NN>-<bloque>-<descripcion>.png
```

- `NN` = número de ISS (`00`, `01`, `02`, …).
- `bloque` = subsección del documento (`01`, `05b`, `08`, …).
- `descripcion` = texto corto en kebab-case.

## Cómo se toman

Las capturas se toman de una **terminal real** (ventana
`Evidencias - TextilClean Express`, controlada desde opencode) y de la **ventana
del navegador**. Nunca se recortan del chat.

Cuando un bloque de código es largo, la captura muestra solo el **final del
bloque y el resultado** que produce (listados, `tsc`, build, test o `curl`).

## Contenido actual

| ISS | Archivos                  | Bloques                                                                                               |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| 01  | `iss-01-01` … `iss-01-05` | versiones, PrimeNG, build, test, pantalla                                                             |
| 02  | `iss-02-01` … `iss-02-11` | entornos, modelos, servicios, utilidades, UI, layout, `HttpClient`, build, test, `ng serve`, pantalla |
| 04  | `iss-04-01` … `iss-04-08` | lista, filtro, edición, baja, validación, móvil                                                       |
| 05  | `iss-05-01` … `iss-05-06` | lista, alta con tipo, edición, móvil                                                                  |
| 06  | `iss-06-01` … `iss-06-05` | ventas, borrador, stock insuficiente, registrada, 403 al cancelar                                     |
| 07  | `iss-07-01` … `iss-07-06` | dashboard, detalle de venta, líneas, 403 al escribir                                                  |
| 08  | `iss-08-01` … `iss-08-07` | sin sesión, login, perfil, refresh, logout                                                            |
| 09  | `iss-09-01` … `iss-09-09` | seller vs admin, `/forbidden`, menú de usuario                                                        |
| 10  | `iss-10-01` … `iss-10-11` | usuarios, roles, recursos, asignaciones, concesiones, revocación                                      |
| 11  | `iss-11-01` … `iss-11-16` | checklist de humo y publicación del `dist/`                                                           |

> Desde ISS-04 las capturas se tomaron con **Chromium headless (Playwright)**
> en un contenedor en la nube, contra el backend real. Ver la sección
> «Entorno de esta verificación» de `iss-04-verificacion.md`.

Las capturas se referencian desde los documentos con rutas relativas:
`![descripción](imagenes/archivo.png)`.
