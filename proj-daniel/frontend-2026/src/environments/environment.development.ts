/**
 * Entorno de desarrollo (`ng serve` y `npm test`).
 *
 * Es el archivo que Angular importa en el día a día vía `fileReplacements`.
 * Mantén aquí la misma `primeUiLicense` que en producción.
 */
export const environment = {
  production: false,
  appName: 'TextilClean Express',
  apiUrl: 'http://localhost:3000/api',
  requireAuth: true,
  primeUiLicense: '',
};
