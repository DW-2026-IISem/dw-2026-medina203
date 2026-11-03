/**
 * Entorno de producción (`ng build`).
 *
 * `apiUrl` termina en `/api` SIN slash final: con uno, las llamadas saldrían
 * como `//clientes` y Express las trataría como otra ruta.
 *
 * `requireAuth`: mitad frontal del interruptor de fases. Nadie lo lee hasta
 * ISS-08 (Fase II). Se empareja con `AUTH_ENABLED` del backend.
 *
 * `primeUiLicense`: clave Community de PrimeUI (PrimeNG 22). Vacía = aviso en
 * consola; la app funciona.
 */
export const environment = {
  production: true,
  appName: 'TextilClean Express',
  apiUrl: 'http://localhost:3000/api',
  requireAuth: true,
  primeUiLicense: '',
};
