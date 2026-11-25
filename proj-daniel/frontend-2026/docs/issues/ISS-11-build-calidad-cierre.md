# ISS-11 · Build, calidad y cierre del proyecto — TextilClean

**Fase II.** **Bloqueado por:** ISS-10. **Cierre del frontend.**

## Calidad

| Comando | Resultado |
|---|---|
| `npm run format:check` | Prettier sin diferencias |
| `npm run build` | Build de producción **≈ 576 kB** iniciales (≈ 136 kB transferidos), sin avisos de presupuesto (límite 750 kB) |
| `npm run test:ci` | **94 pruebas** en 24 archivos (Vitest + jsdom) |
| `npm run check` | Las tres anteriores en orden |

- `vitest-base.config.mts` (`runnerConfig` en `angular.json`): 2 workers y 20 s de timeout,
  pensado para WSL y equipos modestos.
- Accesibilidad: enlace «Saltar al contenido», `aria-label` en todos los botones de icono,
  etiquetas `<label for>` en los formularios y `lang="es"`.

## Publicación

`npm run build` genera `dist/front-textilclean-express/browser`. Como es una SPA, el servidor
debe devolver `index.html` para cualquier ruta (`public/_redirects` ya lo declara para
Netlify; en Nginx: `try_files $uri /index.html;`). En producción, `apiUrl` de
`environment.ts` debe apuntar al backend publicado.

## Checklist de humo (navegador real contra el backend, `AUTH_ENABLED=true`)

| # | Verificación | Resultado |
|---|---|---|
| 1 | Login con contraseña incorrecta muestra «Invalid credentials» | ✅ |
| 2 | Operario registra una orden con una línea por kg (8,75 kg) y otra por unidad; el total del backend coincide con el de la pantalla | ✅ |
| 3 | Operario avanza la orden Recibida → En proceso → Lista → Entregada | ✅ |
| 4 | Operario no ve «Anular» ni «Eliminar» en órdenes | ✅ |
| 5 | Operario en `/admin/usuarios` termina en `/forbidden` | ✅ |
| 6 | El menú del operario no muestra «Seguridad» | ✅ |
| 7 | Las líneas de una orden entregada quedan bloqueadas en «Detalle de órdenes» | ✅ |
| 8 | El administrador ve y gestiona las asignaciones de rol | ✅ |
| 9 | Con un access token inválido, el interceptor renueva con el refresh y la página carga | ✅ |
| 10 | «Cerrar sesión» revoca el refresh token y vuelve a `/login` | ✅ |
| 11 | Sin errores de JavaScript en la consola | ✅ |

## Resumen del proyecto

| Fase | Issues | Resultado |
|---|---|---|
| 0 | ISS-00, ISS-01 | Requisitos y bootstrap Angular 22 + PrimeNG + Tailwind |
| I | ISS-02 a ISS-07 | Modelos y servicios, clientes, tipos de prenda, servicios, órdenes transaccionales, detalle y panel |
| II | ISS-08 a ISS-11 | Sesión JWT, guards y RBAC en la UI, administración de seguridad, calidad y cierre |
