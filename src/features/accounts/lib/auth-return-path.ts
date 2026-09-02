const fallbackReturnPath = "/workspace";
const applicationOrigin = "https://equiverse.invalid";

function hasUnsafePathSyntax(value: string) {
  let decoded = value;

  for (let round = 0; round < 4; round += 1) {
    if (decoded.startsWith("//") || decoded.startsWith("/\\") || decoded.includes("\\") || decoded.includes("\0")) {
      return true;
    }

    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) return false;
      decoded = next;
    } catch {
      return true;
    }
  }

  return decoded.startsWith("//") || decoded.startsWith("/\\") || decoded.includes("\\") || decoded.includes("\0");
}

/** Returns only a same-origin path suitable for client-side navigation after authentication. */
export function getSafeAuthReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || hasUnsafePathSyntax(value)) return fallbackReturnPath;

  try {
    const destination = new URL(value, applicationOrigin);
    if (destination.origin !== applicationOrigin || hasUnsafePathSyntax(destination.pathname)) return fallbackReturnPath;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallbackReturnPath;
  }
}
