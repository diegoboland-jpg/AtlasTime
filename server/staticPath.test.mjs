import { describe, expect, it } from "vitest";
import { resolve, sep } from "node:path";
import { resolveStaticPath } from "./staticPath.mjs";

describe("connected server static paths", () => {
  it("resolves built assets when the configured root has a trailing separator", () => {
    const root = `${resolve("dist")}${sep}`;
    expect(resolveStaticPath(root, "/assets/app.js")).toBe(resolve("dist", "assets", "app.js"));
  });

  it("rejects paths outside the built application", () => {
    expect(resolveStaticPath(resolve("dist"), "/../../private.txt")).toBeNull();
  });
});
