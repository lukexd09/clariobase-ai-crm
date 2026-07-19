import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

type ProcResult = ReturnType<typeof spawnSync>;
type ProofClient = {
  $disconnect: () => Promise<void>;
  $queryRaw: <T = unknown>(query: TemplateStringsArray, ...values: unknown[]) => Promise<T>;
};

function run(command: string, args: string[], env: Record<string, string> = {}): ProcResult {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    encoding: "utf8",
    shell: true
  });
}

function printResult(label: string, result: ProcResult) {
  console.log(JSON.stringify({
    label,
    status: result.status,
    signal: result.signal,
    error: result.error ? { name: result.error.name, message: result.error.message, code: (result.error as NodeJS.ErrnoException).code } : null,
    stdout: result.stdout?.toString().trim(),
    stderr: result.stderr?.toString().trim()
  }, null, 2));
}

function normalizeGeneratedSchema(schema: string, outputDir: string) {
  const generator = `generator client {\n  provider = "prisma-client"\n  output   = "${outputDir.replace(/\\/g, "\\\\")}"\n}\n\n`;
  const withoutGenerator = schema.replace(/generator client \{[\s\S]*?\}\r?\n\r?\n/g, "");
  return generator + withoutGenerator.replace(/\n\s*url\s*=\s*env\("DATABASE_URL"\)\s*/g, "\n");
}

async function loadTempClient(tempClientDir: string) {
  return import(pathToFileURL(path.join(tempClientDir, "client.js")).href);
}

async function preparePrismaRuntimeLink(tempRoot: string) {
  const targetDir = path.join(tempRoot, "node_modules", "@prisma");
  await mkdir(targetDir, { recursive: true });
  await symlink(path.join(process.cwd(), "node_modules", "@prisma", "client"), path.join(targetDir, "client"), "junction");
}

async function main() {
  const cwd = process.cwd();
  const repoRoot = cwd.endsWith(`${path.sep}tools${path.sep}e011-auth-recovery`)
    ? path.resolve(cwd, "..", "..")
    : cwd;
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "clariobase-better-auth-"));
  const generatedSchema = path.join(tmpRoot, "schema.prisma");
  const tempClientDir = path.join(tmpRoot, "proof-client");
  await preparePrismaRuntimeLink(tmpRoot);
  try {
    const snapshotPath = path.join(repoRoot, "scripts", "fixtures", "e011", "better-auth-core.schema.prisma");
    await copyFile(snapshotPath, generatedSchema);

    const schema = await readFile(generatedSchema, "utf8");
    await writeFile(generatedSchema, normalizeGeneratedSchema(schema, tempClientDir), "utf8");

    const validate = run("node", ["./node_modules/prisma/build/index.js", "validate", "--schema", generatedSchema], {
      DATABASE_URL: process.env.BETTER_AUTH_PROOF_DATABASE_URL ?? process.env.DATABASE_URL ?? ""
    });
    printResult("validate", validate);
    assert.equal(validate.status, 0);

    const generateClient = run("node", ["./node_modules/prisma/build/index.js", "generate", "--schema", generatedSchema], {
      DATABASE_URL: process.env.BETTER_AUTH_PROOF_DATABASE_URL ?? process.env.DATABASE_URL ?? ""
    });
    printResult("prisma-generate", generateClient);
    assert.equal(generateClient.status, 0);

    const dbPush = run("node", ["./node_modules/prisma/build/index.js", "db", "push", "--schema", generatedSchema, "--url", process.env.BETTER_AUTH_PROOF_DATABASE_URL ?? process.env.DATABASE_URL ?? "", "--accept-data-loss"], {
      DATABASE_URL: process.env.BETTER_AUTH_PROOF_DATABASE_URL ?? process.env.DATABASE_URL ?? ""
    });
    printResult("db-push", dbPush);
    assert.equal(dbPush.status, 0);

    const tempClientModule = await loadTempClient(tempClientDir);
    const { PrismaClient: ProofPrismaClient } = tempClientModule as { PrismaClient: new (options: unknown) => ProofClient };
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const { createProofAuth } = await import("./better-auth-proof-auth");

    const connectionString = process.env.BETTER_AUTH_PROOF_DATABASE_URL ?? process.env.DATABASE_URL;
    assert(connectionString, "proof database url required");

    const bootstrapPrisma = new ProofPrismaClient({ adapter: new PrismaPg({ connectionString }) });
    const proofPrisma = new ProofPrismaClient({ adapter: new PrismaPg({ connectionString }) });
    const bootstrapAuth = createProofAuth(bootstrapPrisma, false);
    const proofAuth = createProofAuth(proofPrisma, true);
    const email = `proof-${Date.now()}@example.test`;
    const password = "proof-password-1234";

    await assert.rejects(() => proofAuth.api.signUpEmail({ body: { name: "Proof User", email, password } }), /sign up|disabled|not allowed|APIError/i);

    const signup = await bootstrapAuth.api.signUpEmail({ body: { name: "Proof User", email, password }, returnHeaders: true });
    console.log(JSON.stringify({ label: "controlled-signup", hasHeaders: Boolean((signup as { headers?: Headers }).headers) }, null, 2));

    const signIn = await proofAuth.api.signInEmail({ body: { email, password, rememberMe: true }, returnHeaders: true });
    const signInHeaders = (signIn as { headers?: Headers }).headers;
    assert(signInHeaders);
    const setCookies = typeof (signInHeaders as Headers & { getSetCookie?: () => string[] }).getSetCookie === "function"
      ? (signInHeaders as Headers & { getSetCookie?: () => string[] }).getSetCookie()
      : [];
    assert(setCookies.length > 0);
    const cookieHeader = setCookies.map((value) => value.split(";")[0]).join("; ");
    const sessionHeaders = new Headers({ cookie: cookieHeader });

    const session = await proofAuth.api.getSession({ headers: sessionHeaders });
    assert(session);
    console.log(JSON.stringify({ label: "session", session: { userId: session.user?.id, hasUser: Boolean(session.user), hasSession: Boolean(session.session) } }, null, 2));

    const proofAuthReloaded = createProofAuth(new ProofPrismaClient({ adapter: new PrismaPg({ connectionString }) }), true);
    const sessionAfterReload = await proofAuthReloaded.api.getSession({ headers: sessionHeaders });
    assert(sessionAfterReload);

    await proofAuthReloaded.api.signOut({ headers: sessionHeaders });

    const sessionAfterLogout = await proofAuthReloaded.api.getSession({ headers: sessionHeaders });
    assert.equal(sessionAfterLogout, null);

    await assert.rejects(() => proofAuthReloaded.api.signInEmail({ body: { email, password: "wrong-password" } }), /credentials|password|invalid|APIError/i);

    const createdTables = await proofPrisma.$queryRaw<Array<{ table_name: string }>>`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `;
    console.log(JSON.stringify({ label: "tables", tables: createdTables.map((row) => row.table_name) }, null, 2));
    assert.deepEqual(createdTables.map((row) => row.table_name), ["account", "session", "user", "verification"]);

    await bootstrapPrisma.$disconnect();
    await proofPrisma.$disconnect();

    console.log(JSON.stringify({
      tmpRoot,
      generatedSchema,
      tempClientDir,
      result: "ok"
    }, null, 2));
  } finally {
    await rm(tmpRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
