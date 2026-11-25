# ISS-01 · Bootstrap Angular 22 + PrimeNG + Tailwind — TextilClean

**Bloqueado por:** ISS-00. **Habilita:** ISS-02.

## Objetivo

Crear el proyecto Angular 22 (standalone, zoneless, signals) dentro de
`frontend-2026` e integrar PrimeNG 22 con el tema Aura y Tailwind CSS 4.

## Comandos

```bash
cd ~/ia-lab-academica/proyectos/dw/proj-daniel/frontend-2026
ng new front-textilclean-express --directory . --style=tailwind --routing \
  --ssr=false --skip-git --package-manager=npm --defaults
npm install primeng @primeuix/themes primeicons @angular/cdk
npm start        # http://localhost:4200
```

> `ng new .` no sirve: el punto no es un nombre de paquete npm válido. Se usa
> `ng new <nombre> --directory .`.

## Archivos clave

| Archivo | Qué hace |
|---|---|
| `src/styles.css` | `@layer theme, base, primeng, utilities;` + Tailwind + primeicons |
| `src/app/app.config.ts` | `provideRouter` (input binding, scroll) y `providePrimeNG` con Aura y capa CSS `primeng` |
| `src/environments/*.ts` | `primeUiLicense` (clave Community; vacía = solo un aviso) |
| `src/app/app.*` | Tarjeta de bienvenida que prueba un botón PrimeNG + signal |
| `.prettierrc` | `printWidth: 100`, comillas simples, parser `angular` para HTML |

## Verificación

```bash
npm run build    # Application bundle generation complete
npm test         # 2 pruebas en verde (App)
```

## Criterios de aceptación

- [x] Proyecto Angular 22 en la raíz de `frontend-2026`
- [x] PrimeNG 22 + Aura + primeicons + Tailwind 4 con capas CSS ordenadas
- [x] Build y pruebas en verde
