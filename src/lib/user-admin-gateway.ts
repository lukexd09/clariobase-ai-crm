import { createAppAuth } from "@/lib/auth";
import {
  assertAdminRole,
  getApprovedAdminOperations,
  getProhibitedAdminOperations,
  type AdminActor
} from "@/lib/admin-policy";

export type AdminGatewayResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: 401 | 403 | 409 | 501; code: string; message: string };

type GatewayContext = {
  headers?: Headers;
};

const auth = createAppAuth();

function notImplemented(code: string, message: string): AdminGatewayResult<never> {
  return { ok: false, status: 501, code, message };
}

function unauthorized(code = "unauthorized", message = "Admin access required"): AdminGatewayResult<never> {
  return { ok: false, status: 401, code, message };
}

function forbidden(code: string, message: string): AdminGatewayResult<never> {
  return { ok: false, status: 403, code, message };
}

function conflict(code: string, message: string): AdminGatewayResult<never> {
  return { ok: false, status: 409, code, message };
}

async function resolveActor(context?: GatewayContext) {
  if (!context?.headers) {
    return null;
  }

  const session = await auth.api.getSession({ headers: context.headers });
  const user = session?.user;

  if (!user) {
    return null;
  }

  const sessionUser = user as unknown as Record<string, unknown>;

  return {
    id: user.id,
    email: user.email ?? null,
    role: typeof sessionUser.role === "string"
      ? sessionUser.role
      : null,
    banned: typeof sessionUser.banned === "boolean"
      ? sessionUser.banned
      : null
  } satisfies AdminActor;
}

function requireAdminActor(actor: AdminActor | null) {
  if (!actor) {
    return unauthorized();
  }

  try {
    assertAdminRole(actor);
    return null;
  } catch {
    return forbidden("forbidden", "Admin access required");
  }
}

function denyProhibitedOperation(operation: string): AdminGatewayResult<never> {
  return forbidden("prohibited_operation", `Operation is prohibited: ${operation}`);
}

export async function listUsers(context?: GatewayContext): Promise<AdminGatewayResult<readonly never[]>> {
  const actor = await resolveActor(context);
  const denied = requireAdminActor(actor);
  if (denied) {
    return denied;
  }

  return notImplemented("admin_gateway_deferred", "User listing is deferred until the schema migration and gateway implementation are complete");
}

export async function createControlledUser(context?: GatewayContext): Promise<AdminGatewayResult<never>> {
  const actor = await resolveActor(context);
  const denied = requireAdminActor(actor);
  if (denied) {
    return denied;
  }

  return notImplemented("admin_gateway_deferred", "Controlled user creation is deferred");
}

export async function updateBasicIdentity(context?: GatewayContext): Promise<AdminGatewayResult<never>> {
  const actor = await resolveActor(context);
  const denied = requireAdminActor(actor);
  if (denied) {
    return denied;
  }

  return notImplemented("admin_gateway_deferred", "Basic identity updates are deferred");
}

export async function disableUser(context?: GatewayContext): Promise<AdminGatewayResult<never>> {
  const actor = await resolveActor(context);
  const denied = requireAdminActor(actor);
  if (denied) {
    return denied;
  }

  return conflict("last_admin_protection", "Disablement is deferred until last-admin protection is fully implemented");
}

export async function reactivateUser(context?: GatewayContext): Promise<AdminGatewayResult<never>> {
  const actor = await resolveActor(context);
  const denied = requireAdminActor(actor);
  if (denied) {
    return denied;
  }

  return conflict("self_lockout_protection", "Reactivation is deferred until self-lockout protection is fully implemented");
}

export async function listUserSessions(context?: GatewayContext): Promise<AdminGatewayResult<readonly never[]>> {
  const actor = await resolveActor(context);
  const denied = requireAdminActor(actor);
  if (denied) {
    return denied;
  }

  return notImplemented("admin_gateway_deferred", "Session listing is deferred");
}

export async function revokeUserSessions(context?: GatewayContext): Promise<AdminGatewayResult<never>> {
  const actor = await resolveActor(context);
  const denied = requireAdminActor(actor);
  if (denied) {
    return denied;
  }

  return notImplemented("admin_gateway_deferred", "Session revocation is deferred");
}

export async function setUserPassword(context?: GatewayContext): Promise<AdminGatewayResult<never>> {
  const actor = await resolveActor(context);
  const denied = requireAdminActor(actor);
  if (denied) {
    return denied;
  }

  return notImplemented("admin_gateway_deferred", "Recovery password handling is deferred");
}

export function prohibitImpersonation() {
  return denyProhibitedOperation("impersonation");
}

export function prohibitHardDelete() {
  return denyProhibitedOperation("hard delete");
}

export function prohibitArbitraryEndpointForwarding() {
  return denyProhibitedOperation("arbitrary endpoint forwarding");
}

export function prohibitOrganizationOperations() {
  return denyProhibitedOperation("organization");
}

export function prohibitTeamOperations() {
  return denyProhibitedOperation("team");
}

export function prohibitWorkspaceOperations() {
  return denyProhibitedOperation("workspace");
}

export function assertLastAdminProtection() {
  return conflict("last_admin_protection", "Last-admin protection is deferred until data-backed enforcement exists");
}

export function assertSelfLockoutProtection() {
  return conflict("self_lockout_protection", "Self-lockout protection is deferred until data-backed enforcement exists");
}

export const ADMIN_GATEWAY_APPROVED_OPERATIONS = getApprovedAdminOperations();
export const ADMIN_GATEWAY_PROHIBITED_OPERATIONS = getProhibitedAdminOperations();
