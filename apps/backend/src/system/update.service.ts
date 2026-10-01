import {
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';

export interface VersionInfo {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  releaseUrl: string | null;
  checkedAt: string;
}

const GITHUB_REPO = 'Raktim94/nodedr-restaurant-pos';
// Avoid hammering GitHub's unauthenticated rate limit (60 req/hr per IP,
// shared across every self-hosted install behind the same egress IP in the
// worst case) — a check this infrequent is still fast enough to surface a
// new release the same day it ships. Same TTL as Submify/Zulivio's own
// update checkers, for consistency across the three products.
const CACHE_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class UpdateService {
  private readonly logger = new Logger(UpdateService.name);
  private cache: VersionInfo | null = null;
  private cacheExpiresAt = 0;

  async checkForUpdate(): Promise<VersionInfo> {
    if (this.cache && Date.now() < this.cacheExpiresAt) {
      return this.cache;
    }

    const currentVersion = (process.env.APP_VERSION ?? '').trim() || 'dev';
    let latestVersion: string | null = null;
    try {
      latestVersion = await this.fetchLatestTag();
    } catch (err) {
      this.logger.warn(
        `update check failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const info: VersionInfo = {
      currentVersion,
      latestVersion,
      updateAvailable:
        currentVersion !== 'dev' &&
        latestVersion !== null &&
        isNewer(latestVersion, currentVersion),
      releaseUrl: latestVersion
        ? `https://github.com/${GITHUB_REPO}/releases/tag/${latestVersion}`
        : null,
      checkedAt: new Date().toISOString(),
    };
    this.cache = info;
    this.cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return info;
  }

  /**
   * Host-level Docker execution has been decommissioned for multi-tenant security.
   * Container updates must be performed via platform host infrastructure.
   */
  async applyUpdate(): Promise<{ status: string; message: string }> {
    throw new ForbiddenException(
      'Host container updates via application APIs are disabled for multi-tenant security.',
    );
  }

  private async fetchLatestTag(): Promise<string | null> {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/tags?per_page=1`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'nodedr-restaurant-pos-update-check',
        },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) return null;
    const tags = (await res.json()) as Array<{ name: string }>;
    return tags[0]?.name ?? null;
  }
}

function shellQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

function parseSemver(v: string): [number, number, number] {
  const parts = v
    .replace(/^v/i, '')
    .split('.')
    .map((n) => parseInt(n, 10));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function isNewer(latest: string, current: string): boolean {
  const [la, lb, lc] = parseSemver(latest);
  const [ca, cb, cc] = parseSemver(current);
  if (la !== ca) return la > ca;
  if (lb !== cb) return lb > cb;
  return lc > cc;
}
