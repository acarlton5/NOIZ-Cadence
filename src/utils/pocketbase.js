import PocketBase from "pocketbase";

const pocketBaseUrl = import.meta.env.VITE_POCKETBASE_URL?.trim();

if (!pocketBaseUrl) {
  console.warn(
    "VITE_POCKETBASE_URL is not configured. Avatar assets will not load until a PocketBase endpoint is provided."
  );
}

export const pb = pocketBaseUrl ? new PocketBase(pocketBaseUrl) : null;
export const pocketBaseConfigured = Boolean(pocketBaseUrl);

