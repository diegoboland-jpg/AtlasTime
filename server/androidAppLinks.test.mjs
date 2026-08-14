import { describe, expect, it } from "vitest";
import { createAndroidAssetLinks, normalizeAndroidFingerprint } from "./androidAppLinks.mjs";

const rawFingerprint = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("Android Digital Asset Links", () => {
  it("normalizes a SHA-256 signing fingerprint", () => {
    expect(normalizeAndroidFingerprint(rawFingerprint)).toBe(
      "01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF",
    );
  });

  it("creates the least-privilege app-link association", () => {
    expect(createAndroidAssetLinks({
      packageId: "com.badie.kikroo",
      sha256Fingerprints: `${rawFingerprint}, ${rawFingerprint}`,
    })).toEqual([{
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.badie.kikroo",
        sha256_cert_fingerprints: [
          "01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF",
        ],
      },
    }]);
  });

  it("stays disabled until a signing fingerprint is present", () => {
    expect(createAndroidAssetLinks({})).toBeNull();
    expect(createAndroidAssetLinks({ packageId: "com.badie.kikroo" })).toBeNull();
    expect(() => createAndroidAssetLinks({ sha256Fingerprints: rawFingerprint })).toThrow(/PACKAGE_ID is required/);
    expect(() => createAndroidAssetLinks({ packageId: "not valid", sha256Fingerprints: rawFingerprint })).toThrow(/valid Android/);
  });
});
