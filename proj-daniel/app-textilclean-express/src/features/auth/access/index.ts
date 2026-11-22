import { authenticate } from "./authenticate.middleware";
import { authorize } from "./authorize.middleware";

export * from "./authenticate.middleware";
export * from "./authorize.middleware";
export * from "./auth-switch";

/**
 * Las 3 modalidades de acceso por ruta:
 *
 * | Modalidad  | Middlewares              | Ejemplo                         |
 * |------------|--------------------------|---------------------------------|
 * | OPEN       | ninguno                  | POST /api/sesion/login, /api/docs |
 * | JWT        | `jwtOnly`                | GET /api/sesion/perfil          |
 * | JWT + RBAC | `protect`                | todo el negocio y la seguridad  |
 */
export const jwtOnly = [authenticate];
export const protect = [authenticate, authorize];
