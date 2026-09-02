const defaultProductionOrigin = "https://equiverse-xi.vercel.app";

function configuredOrigin() {
  const candidate = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? defaultProductionOrigin;
  try {
    return new URL(candidate).origin;
  } catch {
    return defaultProductionOrigin;
  }
}

export const siteUrl = new URL(configuredOrigin());
