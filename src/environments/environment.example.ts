/**
 * Este archivo es un ejemplo de cómo debe configurar su entorno. No lo utilice en producción.
 * Sólo es una guía para cofigurar `environment.ts`.
 *
 * Por ninguna razón publique sus credenciales, APIs o URLs en un repositorio público.
 */

export const environment = {
  production: false,
  backendUrl: '<FIREBASE_URL> or <ANOTHER_URL>',
  // Para obtener geoposicionamiento utilizo `locationIQ`. Hay muchas alternativas. Utiliza la que quieras.
  locationIQ: {
    reverseBaseUrl: '<REVERSE_URL>',
    staticMapBaseUrl: '<STATIC_MAP_URL>',
    apiKey: '<YOUR_API_KEY>',
  },
  firebaseKey: '<YOUR_FIREBASE_KEY>',
};
