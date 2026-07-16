import { auth } from "@/lib/auth";

async function main() {
  const cookie = process.env.T013_USER_COOKIE;
  if (!cookie) throw new Error("T013_USER_COOKIE is required");
  const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
  if (!session?.user.id || !session.session.id) throw new Error("Session is not active");
  console.log("T013_DATABASE_SESSION: ACTIVE");
}

main().catch(() => {
  console.error("T013 database session verification failed");
  process.exitCode = 1;
});
