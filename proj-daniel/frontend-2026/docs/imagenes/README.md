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

Las capturas se referencian desde los documentos con rutas relativas:
`![descripción](imagenes/archivo.png)`.
