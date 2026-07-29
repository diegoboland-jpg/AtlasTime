import { resolve, sep } from "node:path";

export function resolveStaticPath(root, pathname) {
  const normalizedRoot = resolve(root);
  const requested = resolve(normalizedRoot, `.${decodeURIComponent(pathname)}`);
  return requested === normalizedRoot || requested.startsWith(`${normalizedRoot}${sep}`)
    ? requested
    : null;
}
