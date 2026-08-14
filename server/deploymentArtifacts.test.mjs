import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

describe("Render staging artifacts", () => {
  it("defines a Docker web service with health checks and a persistent data disk", async () => {
    const blueprint = await readFile(new URL("render.yaml", root), "utf8");
    expect(blueprint).toContain("runtime: docker");
    expect(blueprint).toContain("autoDeployTrigger: checksPass");
    expect(blueprint).toContain("healthCheckPath: /api/health");
    expect(blueprint).toContain("mountPath: /data");
    expect(blueprint).toContain("ATLASTIME_DATA_ENCRYPTION_KEY");
    expect(blueprint).toContain("ANDROID_APP_PACKAGE_ID");
    expect(blueprint).toContain("ANDROID_SHA256_CERT_FINGERPRINTS");
    expect(blueprint).toContain("sync: false");
    expect(blueprint).not.toMatch(/CLIENT_SECRET\s*\n\s*value:/);
  });

  it("initializes the mounted volume as root and drops to the node user", async () => {
    const dockerfile = await readFile(new URL("Dockerfile", root), "utf8");
    const entrypoint = await readFile(new URL("docker-entrypoint.sh", root), "utf8");
    expect(dockerfile).toContain('ENTRYPOINT ["/usr/local/bin/atlastime-entrypoint"]');
    expect(dockerfile).toContain("su-exec");
    expect(entrypoint).toContain("chown -R node:node /data");
    expect(entrypoint).toContain('exec su-exec node:node "$@"');
  });
});
