import { bootstrapFirstAdmin } from "@/lib/admin-bootstrap";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main() {
  if (process.env.CLARIOBASE_BOOTSTRAP_ENABLED !== "1") throw new Error("Bootstrap gate is closed");
  await bootstrapFirstAdmin({
    email: required("CLARIOBASE_BOOTSTRAP_ADMIN_EMAIL"),
    name: "Disposable T013 Admin",
    password: required("CLARIOBASE_BOOTSTRAP_ADMIN_PASSWORD")
  });
  console.log("T013_CONTROLLED_ADMIN: READY");
}

main().catch(() => {
  console.error("T013 controlled admin bootstrap failed");
  process.exitCode = 1;
});
