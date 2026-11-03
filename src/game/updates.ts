import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { APP_VERSION, GITHUB_REPO, UPDATE_FEED } from "../config";
import { compareVersions } from "./versions";

export interface UpdateInfo {
  version: string;
  url: string;
  name?: string;
  publishedAt?: string;
  notes?: string;
}

interface CachedUpdate {
  checkedAt: number;
  latest: UpdateInfo | null;
}

const CACHE_KEY = "kartenweis.update.v1";
const CHECK_INTERVAL = 6 * 60 * 60 * 1000;

export { compareVersions };

function readCache(): CachedUpdate | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedUpdate;
    if (typeof parsed.checkedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(latest: UpdateInfo | null) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ checkedAt: Date.now(), latest }),
    );
  } catch {
    // Ignore storage failures (private mode, quota).
  }
}

async function fetchJson(url: string, timeoutMs = 6000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function updateFromGithub(payload: any): UpdateInfo | null {
  const version = String(payload?.tag_name ?? "").replace(/^v/i, "");
  if (!version) return null;
  return {
    version,
    url: String(payload.html_url ?? `https://github.com/${GITHUB_REPO}/releases`),
    name: typeof payload.name === "string" ? payload.name : undefined,
    publishedAt:
      typeof payload.published_at === "string"
        ? payload.published_at
        : undefined,
    notes: typeof payload.body === "string" ? payload.body : undefined,
  };
}

function updateFromFeed(payload: any): UpdateInfo | null {
  const version = String(payload?.version ?? "").replace(/^v/i, "");
  if (!version) return null;
  return {
    version,
    url: String(payload.url ?? `https://github.com/${GITHUB_REPO}/releases`),
    name: typeof payload.name === "string" ? payload.name : undefined,
    notes: typeof payload.notes === "string" ? payload.notes : undefined,
  };
}

/**
 * Checks the latest release on GitHub (or a custom update feed).
 * Returns null when the app is current, the feed is unavailable, or the
 * repository is private (GitHub answers 404 for unauthenticated requests).
 */
export async function checkForUpdate(force = false): Promise<UpdateInfo | null> {
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_UPDATE_CHECK !== "1" &&
    !UPDATE_FEED
  ) {
    return null;
  }

  const cached = readCache();
  if (!force && cached && Date.now() - cached.checkedAt < CHECK_INTERVAL) {
    return cached.latest;
  }

  const payload = UPDATE_FEED
    ? await fetchJson(UPDATE_FEED)
    : await fetchJson(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      );

  const latest = UPDATE_FEED
    ? updateFromFeed(payload)
    : updateFromGithub(payload);

  if (!latest || compareVersions(latest.version, APP_VERSION) <= 0) {
    writeCache(null);
    return null;
  }

  writeCache(latest);
  return latest;
}

export async function openRelease(url: string) {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
