// Centralized environment configuration for client-visible variables
// Note: Astro exposes only variables prefixed with PUBLIC_

/**
 * Base URL for Possible Minds API and static assets.
 * Configure via .env as PUBLIC_API_BASE_URL (no trailing slash).
 * If scheme is missing (e.g., "localhost:9000"), it defaults to http:// for local dev.
 * Defaults to https://api.possibleminds.in
 */
function normalizeBaseUrl(rawUrl: string | undefined): string {
  const fallback = 'https://api.possibleminds.in';
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.replace(/\/$/, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // No scheme provided; assume http for local dev values like localhost:9000
  return `http://${trimmed}`;
}

export const API_BASE_URL: string = normalizeBaseUrl(((import.meta as any).env?.PUBLIC_API_BASE_URL as string | undefined));

/**
 * Tenant ID used by the chat widget to route requests.
 * Configure via .env as PUBLIC_TENANT_ID. Defaults to the current production tenant.
 */
export const TENANT_ID: string =
  ((import.meta as any).env?.PUBLIC_TENANT_ID as string | undefined) ||
  '3efc36dc-baca-4001-b884-f551df05d095';


