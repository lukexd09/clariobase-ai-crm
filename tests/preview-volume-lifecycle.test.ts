import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function hasDocker() {
  return spawnSync("docker", ["version"], { stdio: "ignore" }).status === 0;
}

const dockerAvailable = hasDocker();

test("Docker volume lifecycle proof preserves marker on down and removes it on down -v", { skip: !dockerAvailable }, () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "clariobase-preview-volume-proof-"));
  const composeFile = path.join(tmpRoot, "compose.yml");
  const projectName = `codex-preview-proof-${Date.now()}`;
  const volumeName = `${projectName}-marker-data`;
  const markerPath = "/data/marker.txt";

  fs.writeFileSync(
    composeFile,
    [
      "services:",
      "  marker:",
      "    image: alpine:3.20",
      "    command: [\"sh\", \"-lc\", \"if [ ! -f /data/marker.txt ]; then date +%s%N > /data/marker.txt; fi; tail -f /dev/null\"]",
      "    volumes:",
      "      - marker-data:/data",
      "volumes:",
      "  marker-data:",
      `    name: ${volumeName}`,
      ""
    ].join("\n"),
    "utf8"
  );

  const env = {
    ...process.env,
    COMPOSE_PROJECT_NAME: projectName
  };

  const run = (args: string[]) =>
    spawnSync("docker", ["compose", "-f", composeFile, ...args], {
      cwd: tmpRoot,
      encoding: "utf8",
      env
    });

  try {
    const up1 = run(["up", "-d"]);
    assert.equal(up1.status, 0, up1.stderr || up1.stdout);

    const readMarker = () =>
      spawnSync("docker", ["compose", "-f", composeFile, "exec", "-T", "marker", "sh", "-lc", `cat ${markerPath}`], {
        cwd: tmpRoot,
        encoding: "utf8",
        env
      });

    const firstRead = readMarker();
    assert.equal(firstRead.status, 0, firstRead.stderr || firstRead.stdout);
    const firstMarker = firstRead.stdout.trim();
    assert.match(firstMarker, /^\d+$/);

    const down1 = run(["down", "--remove-orphans"]);
    assert.equal(down1.status, 0, down1.stderr || down1.stdout);

    const up2 = run(["up", "-d"]);
    assert.equal(up2.status, 0, up2.stderr || up2.stdout);

    const secondRead = readMarker();
    assert.equal(secondRead.status, 0, secondRead.stderr || secondRead.stdout);
    assert.equal(secondRead.stdout.trim(), firstMarker);

    const down2 = run(["down", "-v", "--remove-orphans"]);
    assert.equal(down2.status, 0, down2.stderr || down2.stdout);

    const up3 = run(["up", "-d"]);
    assert.equal(up3.status, 0, up3.stderr || up3.stdout);

    const thirdRead = readMarker();
    assert.equal(thirdRead.status, 0, thirdRead.stderr || thirdRead.stdout);
    assert.match(thirdRead.stdout.trim(), /^\d+$/);
    assert.notEqual(thirdRead.stdout.trim(), firstMarker);
  } finally {
    spawnSync("docker", ["compose", "-f", composeFile, "down", "-v", "--remove-orphans"], {
      cwd: tmpRoot,
      encoding: "utf8",
      env
    });
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
