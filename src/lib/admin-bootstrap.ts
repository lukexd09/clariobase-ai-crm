import { Prisma } from "@/generated/prisma/client";
import { recordAdminAuditEvent } from "@/lib/admin-audit";
import { createAppAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type BootstrapAdminInput = {
  email: string;
  name: string;
  password: string;
};

export type BootstrapAdminResult = { created: boolean };

function isRetryableBootstrapConflict(error: unknown) {
  return Boolean(
    error && typeof error === "object" && "code" in error &&
    (error.code === "P2034" || error.code === "P2002")
  );
}

export async function bootstrapFirstAdmin(input: BootstrapAdminInput): Promise<BootstrapAdminResult> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
        const existing = await transaction.user.findUnique({ where: { email: input.email.toLowerCase() } });
        if (existing) {
          if (existing.role === "admin" && existing.banned === false) return { created: false };
          throw new Error("Bootstrap identity already exists without active administrator access");
        }

        const users = await transaction.user.count();
        if (users !== 0) {
          throw new Error("Bootstrap is allowed only before the first user exists");
        }

        const auth = createAppAuth(transaction);
        const response = await auth.api.createUser({
          body: {
            email: input.email,
            name: input.name,
            password: input.password,
            role: "admin"
          }
        });
        await recordAdminAuditEvent(transaction, {
          actorUserId: null,
          targetUserId: response.user.id,
          operation: "BOOTSTRAP_FIRST_ADMIN"
        });
        return { created: true };
      }, {
        isolationLevel: "Serializable",
        maxWait: 5_000,
        timeout: 10_000
      });
    } catch (error) {
      if (!isRetryableBootstrapConflict(error) || attempt === 3) throw error;
    }
  }

  throw new Error("Bootstrap transaction retry exhausted");
}
