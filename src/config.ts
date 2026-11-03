export const APP_VERSION = __APP_VERSION__;

export const GITHUB_REPO =
  import.meta.env.VITE_GITHUB_REPO || "Burni-ops/kartenweis";

export const UPDATE_FEED = import.meta.env.VITE_UPDATE_FEED || "";

export const RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;
