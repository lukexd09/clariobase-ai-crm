export const CLARIOBASE_ADMIN_ROLES = ["admin"] as const;
export const CLARIOBASE_DEFAULT_ROLE = "user" as const;

export const PROHIBITED_ADMIN_CAPABILITIES = [
  "impersonateUser",
  "stopImpersonating",
  "removeUser",
  "organization",
  "team",
  "workspace",
  "arbitraryEndpointForwarding"
] as const;

export type AdminActor = {
  id: string;
  email: string | null;
  role: string | null;
  banned: boolean | null;
};

export function isAdminRole(role: string | null | undefined) {
  return role === "admin";
}

export function canAdministerUsers(actor: AdminActor | null | undefined) {
  return Boolean(actor && isAdminRole(actor.role) && actor.banned === false);
}

export function assertAdminRole(actor: AdminActor | null | undefined) {
  if (!canAdministerUsers(actor)) {
    throw new Error("Admin access required");
  }
}

export function canDisableUser(_actor: AdminActor | null | undefined) {
  return false;
}

export function canBanUser(_actor: AdminActor | null | undefined) {
  return false;
}

export function canChangeRole(_actor: AdminActor | null | undefined) {
  return false;
}

export function getApprovedAdminOperations() {
  return [
    "listUsers",
    "createUser",
    "getUser",
    "adminUpdateUser",
    "setRole",
    "banUser",
    "unbanUser",
    "listUserSessions",
    "revokeUserSession",
    "revokeUserSessions",
    "setUserPassword",
    "userHasPermission"
  ] as const;
}

export function getProhibitedAdminOperations() {
  return PROHIBITED_ADMIN_CAPABILITIES;
}
