import { spawnSync } from "node:child_process";
import net from "node:net";
import process from "node:process";

export type VerificationStatus = "PASS" | "SKIPPED";

export function hasDocker() {
  const result = spawnSync("docker", ["version"], {
    stdio: "ignore"
  });

  return result.status === 0;
}

export function reportVerificationStatus(status: VerificationStatus, message: string) {
  console.log(`${status}: ${message}`);
}

export function ensureDockerOrReportSkip(commandName: string) {
  if (hasDocker()) {
    return true;
  }

  reportVerificationStatus("SKIPPED", `${commandName} requires Docker, but Docker is not available.`);
  return false;
}

export function createDockerRunId(prefix: string) {
  return `${prefix}-${process.pid}-${Date.now()}`;
}

export function reserveFreePort() {
  return new Promise<string>((resolve, reject) => {
    const server = net.createServer();

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not reserve a free localhost port for Docker verification."));
        return;
      }

      const reservedPort = String(address.port);
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(reservedPort);
      });
    });

    server.on("error", reject);
  });
}
