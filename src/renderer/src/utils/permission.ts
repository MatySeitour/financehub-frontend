import { z } from "zod";

export const permissions = [
  "CASHBOXES:READ",
  "CASHBOXES:CREATE",
  "CASHBOXES:UPDATE",
  "CASHBOXES:DELETE",
  "USERS:READ",
  "USERS:CREATE",
  "USERS:UPDATE",
  "USERS:DELETE",
  "ROLES:READ",
  "ROLES:CREATE",
  "ROLES:UPDATE",
  "ROLES:DELETE",
  "OPERATIONS:READ",
  "OPERATIONS:CREATE",
  "OPERATIONS:UPDATE",
  "OPERATIONS:DELETE",
  "LOANS:READ",
  "LOANS:CREATE",
  "LOANS:UPDATE",
  "LOANS:DELETE",
  // "SETTINGS:READ",
  // "SETTINGS:CREATE",
  // "SETTINGS:UPDATE",
  // "SETTINGS:DELETE",
  "INSTALLMENTS:READ",
  "INSTALLMENTS:CREATE",
  "INSTALLMENTS:UPDATE",
  "INSTALLMENTS:DELETE",
  "CLIENTS:READ",
  "CLIENTS:CREATE",
  "CLIENTS:UPDATE",
  "CLIENTS:DELETE",
  "SELLERS:READ",
  "SELLERS:CREATE",
  "SELLERS:UPDATE",
  "SELLERS:DELETE",
] as const;
export const permissionsSchema = z.enum(permissions);
export type TPermission = z.infer<typeof permissionsSchema>;

type TPermissionAndDeps = Record<TPermission, TPermission[] | null>;
export const permissionsDeps: TPermissionAndDeps = {
  "CASHBOXES:READ": ["USERS:READ"],
  "CASHBOXES:CREATE": ["CASHBOXES:READ"],
  "CASHBOXES:UPDATE": null,
  "CASHBOXES:DELETE": null,
  "USERS:READ": ["ROLES:READ"],
  "USERS:CREATE": ["USERS:READ"],
  "USERS:UPDATE": null,
  "USERS:DELETE": null,
  "OPERATIONS:READ": null,
  "OPERATIONS:CREATE": ["OPERATIONS:READ"],
  "OPERATIONS:UPDATE": null,
  "OPERATIONS:DELETE": null,
  "LOANS:READ": null,
  "LOANS:CREATE": ["LOANS:READ"],
  "LOANS:UPDATE": null,
  "LOANS:DELETE": null,
  "ROLES:READ": null,
  "ROLES:CREATE": ["ROLES:READ"],
  "ROLES:UPDATE": null,
  "ROLES:DELETE": null,
  // "SETTINGS:READ": null,
  // // "SETTINGS:CREATE": ["SETTINGS:READ"],
  // "SETTINGS:UPDATE": null,
  // "SETTINGS:DELETE": null,
  "INSTALLMENTS:READ": null,
  "INSTALLMENTS:CREATE": ["INSTALLMENTS:READ"],
  "INSTALLMENTS:UPDATE": null,
  "INSTALLMENTS:DELETE": null,
  "CLIENTS:READ": null,
  "CLIENTS:CREATE": ["CLIENTS:READ"],
  "CLIENTS:UPDATE": null,
  "CLIENTS:DELETE": null,
  "SELLERS:READ": null,
  "SELLERS:CREATE": ["SELLERS:READ"],
  "SELLERS:UPDATE": null,
  "SELLERS:DELETE": null,
} as const;

export function getDeps(key: TPermission) {
  const values = permissionsDeps[key];
  if (!values) return [];

  const deps: TPermission[] = [];
  for (const element of values) {
    deps.push(element);
    deps.push(...getDeps(element));
  }

  return [...new Set(deps)];
}

// Backwards dependencies ///////////////////////////////////////////////////////
const reverseDeps: Partial<Record<TPermission, TPermission[]>> = {};

// Helper function
for (const [key, values] of Object.entries(permissionsDeps)) {
  if (values) {
    values.forEach((dep) => {
      if (!reverseDeps[dep]) reverseDeps[dep] = [];
      reverseDeps[dep]?.push(key as TPermission); // The "?" in not necessary, but the build process says that shit can be undefined (even being checked in the line above)
    });
  }
}

// Helper function
function collectDependents(key: TPermission, dependents: Set<TPermission>) {
  if (reverseDeps[key]) {
    reverseDeps[key]?.forEach((dep) => {
      // Read line 79 (same thing here)
      if (!dependents.has(dep)) {
        dependents.add(dep);
        collectDependents(dep, dependents); // Recursively add transitive dependents
      }
    });
  }
}

export function getDependents(permission: TPermission): TPermission[] {
  const dependents: Set<TPermission> = new Set();

  collectDependents(permission, dependents);
  return Array.from(dependents);
}
// Backwards dependencies ///////////////////////////////////////////////////////

export const permissionToSpanish: Record<TPermission, string> = {
  "CASHBOXES:READ": "Ver cajas",
  "CASHBOXES:CREATE": "Crear cajas",
  "CASHBOXES:UPDATE": "Editar cajas",
  "CASHBOXES:DELETE": "Eliminar cajas",
  "USERS:READ": "Ver usuarios",
  "USERS:CREATE": "Crear usuarios",
  "USERS:UPDATE": "Editar cajas",
  "USERS:DELETE": "Eliminar cajas",
  "OPERATIONS:READ": "Ver operaciones",
  "OPERATIONS:CREATE": "Crear operaciones",
  "OPERATIONS:UPDATE": "Editar cajas",
  "OPERATIONS:DELETE": "Eliminar cajas",
  "LOANS:READ": "Ver prestamos",
  "LOANS:CREATE": "Crear prestamos",
  "LOANS:UPDATE": "Editar cajas",
  "LOANS:DELETE": "Eliminar cajas",
  "ROLES:READ": "Ver roles",
  "ROLES:CREATE": "Crear roles",
  "ROLES:UPDATE": "Editar cajas",
  "ROLES:DELETE": "Eliminar cajas",
  // "SETTINGS:READ": "Ver configuración",
  // "SETTINGS:CREATE": "Crear configuración",
  // "SETTINGS:UPDATE": "Editar cajas",
  // "SETTINGS:DELETE": "Eliminar cajas",
  "INSTALLMENTS:READ": "Ver cuotas",
  "INSTALLMENTS:CREATE": "Crear cuotas",
  "INSTALLMENTS:UPDATE": "Editar cajas",
  "INSTALLMENTS:DELETE": "Eliminar cajas",
  "CLIENTS:READ": "Ver clientes",
  "CLIENTS:CREATE": "Crear clientes",
  "CLIENTS:UPDATE": "Editar cajas",
  "CLIENTS:DELETE": "Eliminar cajas",
  "SELLERS:READ": "Ver vendedores",
  "SELLERS:CREATE": "Crear vendedores",
  "SELLERS:UPDATE": "Editar cajas",
  "SELLERS:DELETE": "Eliminar cajas",
};

export const permissionNames = [
  "CASHBOXES",
  "USERS",
  "OPERATIONS",
  "LOANS",
  "ROLES",
  // "SETTINGS",
  "INSTALLMENTS",
  "CLIENTS",
  "SELLERS",
] as const;
export const permissionNameSchema = z.enum(permissionNames);
export type PermissionName = z.infer<typeof permissionNameSchema>;

export const permissionNamesToSpanish: Record<PermissionName, string> = {
  CASHBOXES: "Cajas",
  USERS: "Usuarios",
  OPERATIONS: "Operaciones",
  LOANS: "Préstamos",
  ROLES: "Roles",
  // SETTINGS: "Configuración",
  INSTALLMENTS: "Cuotas",
  CLIENTS: "Clientes",
  SELLERS: "Vendedores",
};

export const permissionDescriptions: Record<PermissionName, string> = {
  CASHBOXES: "Invitar usuarios a la organización",
  USERS: "Usuarios de tu organización",
  OPERATIONS: "Puntos de escaneo",
  LOANS: "Configuración de áreas y categorías",
  ROLES: "Roles de los usuarios",
  // SETTINGS: "Configuración general",
  INSTALLMENTS: "Configuración de horarios para empleados",
  CLIENTS: "Empleados activos",
  SELLERS: "Notificaciones de empleados",
};
