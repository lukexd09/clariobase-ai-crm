import { auth } from "@/lib/auth";
import { createControlledUser, revokeUserSessions } from "@/lib/user-admin-gateway";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main() {
  const adminHeaders = new Headers({ cookie: required("T013_ADMIN_COOKIE") });
  if (process.env.T013_GATEWAY_ACTION === "create") {
    await createControlledUser(
      { headers: adminHeaders },
      {
        email: required("T013_USER_EMAIL"),
        name: "Disposable T013 User",
        password: required("T013_USER_PASSWORD")
      }
    );
    console.log("T013_CONTROLLED_USER: CREATED");
    return;
  }

  if (process.env.T013_GATEWAY_ACTION === "revoke") {
    const target = await auth.api.getSession({
      headers: new Headers({ cookie: required("T013_USER_COOKIE") })
    });
    if (!target?.user.id) throw new Error("Target session is unavailable");
    await revokeUserSessions({ headers: adminHeaders }, target.user.id);
    console.log("T013_CONTROLLED_SESSION: REVOKED");
    return;
  }

  throw new Error("Unknown T013 gateway action");
}

main().catch(() => {
  console.error("T013 controlled gateway operation failed");
  process.exitCode = 1;
});
