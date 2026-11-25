/**
 * Entorno de producción (`ng build`).
 *
 * - `apiUrl` termina en `/api` SIN slash final (si no, saldrían URLs `//clientes`).
 * - `requireAuth`: mitad frontal del interruptor de fases; se empareja con
 *   `AUTH_ENABLED` del backend. Nadie lo lee hasta ISS-08.
 * - `primeUiLicense`: clave Community de PrimeUI. Vacía = aviso en consola.
 */
export const environment = {
  production: true,
  appName: 'TextilClean',
  apiUrl: 'http://localhost:4000/api',
  requireAuth: true,
  primeUiLicense: '',
};
