import { APIError } from "better-auth/api";

import { Prisma, type session as SessionRecord } from "@/generated/prisma/client";
import { createAppAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AdminUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminSession = Pick<
  SessionRecord,
  "id" | "userId" | "expiresAt" | "ipAddress" | "userAgent" | "createdAt" | "updatedAt"
>;

export type AdminGatewayResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: 400 | 401 | 403 | 404 | 409 | 500; code: string; message: string };

export type AdminGatewayContext = { headers: Headers };

class AdminGatewayError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 500,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

type TransactionAuth = ReturnType<typeof createAppAuth>;

const SERIALIZABLE_RETRY_LIMIT = 3;

function isSerializableConflict(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2034");
}

async function withSerializableRetry<T>(operation: (transaction: Prisma.TransactionClient) => Promise<T>) {
  for (let attempt = 1; attempt <= SERIALIZABLE_RETRY_LIMIT; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: "Serializable",
        maxWait: 5_000,
        timeout: 10_000
      });
    } catch (error) {
      if (!isSerializableConflict(error) || attempt === SERIALIZABLE_RETRY_LIMIT) throw error;
    }
  }

  throw new Error("Serializable transaction retry exhausted");
}

async function resolveAdminActor(auth: TransactionAuth, headers: Headers) {
  const session = await auth.api.getSession({
    headers,
    query: { disableCookieCache: true }
  });
  if (!session?.user?.id) {
    throw new AdminGatewayError(401, "unauthorized", "Authentication required");
  }

  const user = session.user as unknown as Record<string, unknown>;
  if (user.role !== "admin" || user.banned !== false) {
    throw new AdminGatewayError(403, "forbidden", "Active administrator access required");
  }

  return { id: session.user.id };
}

async function runAdminOperation<T>(
  context: AdminGatewayContext,
  operation: (
    auth: TransactionAuth,
    transaction: Prisma.TransactionClient,
    actor: { id: string }
  ) => Promise<T>
): Promise<AdminGatewayResult<T>> {
  try {
    const data = await withSerializableRetry(async (transaction) => {
      const auth = createAppAuth(transaction);
      const actor = await resolveAdminActor(auth, context.headers);
      return operation(auth, transaction, actor);
    });
    return { ok: true, data };
  } catch (error) {
    if (error instanceof AdminGatewayError) {
      return { ok: false, status: error.status, code: error.code, message: error.message };
    }
    if (error instanceof APIError) {
      const status = error.statusCode;
      return {
        ok: false,
        status: status === 400 || status === 401 || status === 403 || status === 404 ? status : 500,
        code: error.body?.code ?? "admin_operation_failed",
        message: error.body?.message ?? "Administrator operation failed"
      };
    }

    return { ok: false, status: 500, code: "admin_operation_failed", message: "Administrator operation failed" };
  }
}

function toAdminUser(user: Record<string, unknown>): AdminUser {
  if (
    typeof user.id !== "string" || (typeof user.email !== "string" && user.email !== null) ||
    (typeof user.name !== "string" && user.name !== null) ||
    typeof user.role !== "string" || typeof user.banned !== "boolean" ||
    !(user.createdAt instanceof Date) || !(user.updatedAt instanceof Date)
  ) {
    throw new AdminGatewayError(500, "invalid_admin_user", "Authentication provider returned an invalid user");
  }

  return {
    id: user.id,
    email: user.email as string | null,
    name: user.name as string | null,
    role: user.role,
    banned: user.banned,
    banReason: typeof user.banReason === "string" ? user.banReason : null,
    banExpires: user.banExpires instanceof Date ? user.banExpires : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

async function assertTargetExists(transaction: Prisma.TransactionClient, userId: string) {
  const target = await transaction.user.findUnique({ where: { id: userId } });
  if (!target) throw new AdminGatewayError(404, "user_not_found", "User not found");
  return target;
}

async function assertCanDisable(
  transaction: Prisma.TransactionClient,
  actorId: string,
  targetId: string
) {
  if (actorId === targetId) {
    throw new AdminGatewayError(409, "self_lockout", "Administrators cannot disable their own account");
  }

  const target = await assertTargetExists(transaction, targetId);
  if (target.role === "admin" && target.banned === false) {
    const activeAdmins = await transaction.user.count({ where: { role: "admin", banned: false } });
    if (activeAdmins <= 1) {
      throw new AdminGatewayError(409, "last_active_admin", "The last active administrator cannot be disabled");
    }
  }
}

export async function listUsers(
  context: AdminGatewayContext,
  input: { limit?: number; offset?: number; search?: string } = {}
) {
  return runAdminOperation(context, async (auth) => {
    const response = await auth.api.listUsers({
      headers: context.headers,
      query: {
        limit: Math.min(Math.max(input.limit ?? 50, 1), 100),
        offset: Math.max(input.offset ?? 0, 0),
        ...(input.search ? { searchValue: input.search, searchField: "email" as const } : {})
      }
    });
    return {
      users: response.users.map((user) => toAdminUser(user as unknown as Record<string, unknown>)),
      total: response.total
    };
  });
}

export async function getUser(context: AdminGatewayContext, userId: string) {
  return runAdminOperation(context, async (auth) => {
    const user = await auth.api.getUser({ headers: context.headers, query: { id: userId } });
    return toAdminUser(user as unknown as Record<string, unknown>);
  });
}

export async function createControlledUser(
  context: AdminGatewayContext,
  input: { email: string; name: string; password: string }
) {
  return runAdminOperation(context, async (auth) => {
    const response = await auth.api.createUser({
      headers: context.headers,
      body: { email: input.email, name: input.name, password: input.password, role: "user" }
    });
    return toAdminUser(response.user as unknown as Record<string, unknown>);
  });
}

export async function updateBasicIdentity(
  context: AdminGatewayContext,
  input: { userId: string; email: string; name: string }
) {
  return runAdminOperation(context, async (auth) => {
    const user = await auth.api.adminUpdateUser({
      headers: context.headers,
      body: { userId: input.userId, data: { email: input.email, name: input.name } }
    });
    return toAdminUser(user as unknown as Record<string, unknown>);
  });
}

export async function disableUser(
  context: AdminGatewayContext,
  input: { userId: string; reason?: string }
) {
  return runAdminOperation(context, async (auth, transaction, actor) => {
    await assertCanDisable(transaction, actor.id, input.userId);
    const response = await auth.api.banUser({
      headers: context.headers,
      body: { userId: input.userId, banReason: input.reason }
    });
    return toAdminUser(response.user as unknown as Record<string, unknown>);
  });
}

export async function reactivateUser(context: AdminGatewayContext, userId: string) {
  return runAdminOperation(context, async (auth, transaction) => {
    await assertTargetExists(transaction, userId);
    const response = await auth.api.unbanUser({ headers: context.headers, body: { userId } });
    return toAdminUser(response.user as unknown as Record<string, unknown>);
  });
}

export async function listUserSessions(context: AdminGatewayContext, userId: string) {
  return runAdminOperation(context, async (auth, transaction) => {
    await assertTargetExists(transaction, userId);
    const response = await auth.api.listUserSessions({ headers: context.headers, body: { userId } });
    return response.sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    })) satisfies AdminSession[];
  });
}

export async function revokeUserSession(context: AdminGatewayContext, sessionId: string) {
  return runAdminOperation(context, async (auth, transaction, actor) => {
    const target = await transaction.session.findUnique({ where: { id: sessionId } });
    if (!target) throw new AdminGatewayError(404, "session_not_found", "Session not found");
    if (target.userId === actor.id) {
      throw new AdminGatewayError(409, "self_lockout", "Administrators cannot revoke their own session here");
    }
    await auth.api.revokeUserSession({ headers: context.headers, body: { sessionToken: target.token } });
    return { revoked: true as const };
  });
}

export async function revokeUserSessions(context: AdminGatewayContext, userId: string) {
  return runAdminOperation(context, async (auth, transaction, actor) => {
    await assertTargetExists(transaction, userId);
    if (userId === actor.id) {
      throw new AdminGatewayError(409, "self_lockout", "Administrators cannot revoke all their own sessions here");
    }
    await auth.api.revokeUserSessions({ headers: context.headers, body: { userId } });
    return { revoked: true as const };
  });
}

export async function setUserPassword(
  context: AdminGatewayContext,
  input: { userId: string; newPassword: string }
) {
  return runAdminOperation(context, async (auth, transaction, actor) => {
    await assertTargetExists(transaction, input.userId);
    if (input.userId === actor.id) {
      throw new AdminGatewayError(409, "self_lockout", "Administrators cannot reset their own password here");
    }
    await auth.api.setUserPassword({
      headers: context.headers,
      body: { userId: input.userId, newPassword: input.newPassword }
    });
    await auth.api.revokeUserSessions({ headers: context.headers, body: { userId: input.userId } });
    return { passwordUpdated: true as const, sessionsRevoked: true as const };
  });
}

export const ADMIN_GATEWAY_PROHIBITED_OPERATIONS = [
  "impersonateUser",
  "stopImpersonating",
  "removeUser",
  "organization",
  "team",
  "workspace",
  "arbitraryEndpointForwarding"
] as const;
