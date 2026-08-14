const packageSegment = /^[A-Za-z][A-Za-z0-9_]*$/;

export function normalizeAndroidFingerprint(value) {
  const compact = String(value ?? "").replace(/[:\s-]/g, "").toUpperCase();
  if (!/^[0-9A-F]{64}$/.test(compact)) {
    throw new Error("ANDROID_SHA256_CERT_FINGERPRINT must contain exactly 32 SHA-256 bytes.");
  }
  return compact.match(/.{2}/g).join(":");
}

export function createAndroidAssetLinks({ packageId, sha256Fingerprints }) {
  if (!packageId && !sha256Fingerprints) return null;
  if (!packageId || !sha256Fingerprints) {
    throw new Error("ANDROID_APP_PACKAGE_ID and ANDROID_SHA256_CERT_FINGERPRINTS must be configured together.");
  }
  const segments = String(packageId).split(".");
  if (segments.length < 2 || segments.some((segment) => !packageSegment.test(segment))) {
    throw new Error("ANDROID_APP_PACKAGE_ID is not a valid Android application ID.");
  }
  const fingerprints = String(sha256Fingerprints)
    .split(",")
    .map((fingerprint) => fingerprint.trim())
    .filter(Boolean)
    .map(normalizeAndroidFingerprint);
  if (!fingerprints.length) throw new Error("At least one Android signing fingerprint is required.");
  return [{
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: packageId,
      sha256_cert_fingerprints: [...new Set(fingerprints)],
    },
  }];
}
