import { bootstrapFirstAdmin } from "@/lib/admin-bootstrap";

function requireEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main() {
  if (process.env.CLARIOBASE_BOOTSTRAP_ENABLED !== "1") {
    throw new Error("CLARIOBASE_BOOTSTRAP_ENABLED=1 is required");
  }

  const result = await bootstrapFirstAdmin({
    email: requireEnvironment("CLARIOBASE_BOOTSTRAP_ADMIN_EMAIL"),
    name: requireEnvironment("CLARIOBASE_BOOTSTRAP_ADMIN_NAME"),
    password: requireEnvironment("CLARIOBASE_BOOTSTRAP_ADMIN_PASSWORD")
  });

  console.log(result.created ? "BOOTSTRAP_ADMIN: CREATED" : "BOOTSTRAP_ADMIN: ALREADY_EXISTS");
}

main().catch(() => {
  console.error("Administrator bootstrap failed");
  process.exitCode = 1;
});
