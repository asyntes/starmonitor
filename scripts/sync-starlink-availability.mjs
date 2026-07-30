#!/usr/bin/env node
/**
 * Sync Starlink service-availability map data from the public map feed.
 *
 * Source: https://api.starlink.com/public-files/availability.json
 * (same JSON used by https://www.starlink.com/map)
 *
 * This is NOT an officially licensed Starlink developer API. The file is a
 * public map asset. We fetch it infrequently, attribute the source, keep a
 * local copy for the visualization, and do not hotlink it from browsers.
 * SpaceX/Starlink retain rights in their materials. Stop syncing if asked.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_URL = 'https://api.starlink.com/public-files/availability.json';
const MAP_URL = 'https://www.starlink.com/map';
const USER_AGENT =
  'starmonitor-availability-sync/1.0 (+https://github.com/asyntes/starmonitor; weekly public map feed mirror)';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT, 'public/json/availability.json');
const META_PATH = path.join(ROOT, 'public/json/availability.meta.json');

const KNOWN_STATUSES = new Set([
  'available',
  'launched',
  'coming_soon',
  'pending_regulatory',
  'unknown',
  'blacklisted',
  'exclude',
  'faq',
]);

function fail(message) {
  console.error(`sync-starlink-availability: ${message}`);
  process.exit(1);
}

function isStatusEntry(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof value.status === 'string' &&
    value.status.length > 0 &&
    (value.expected === undefined || typeof value.expected === 'string')
  );
}

function validateAvailability(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    fail('payload is not a JSON object');
  }
  if (!data.admin0 || typeof data.admin0 !== 'object' || Array.isArray(data.admin0)) {
    fail('missing admin0 object');
  }

  const admin0Keys = Object.keys(data.admin0);
  if (admin0Keys.length < 100) {
    fail(`admin0 looks too small (${admin0Keys.length} keys)`);
  }

  const seenStatuses = new Set();
  for (const [code, entry] of Object.entries(data.admin0)) {
    if (!/^[A-Z]{2}$/.test(code)) {
      fail(`invalid admin0 country code: ${code}`);
    }
    if (!isStatusEntry(entry)) {
      fail(`invalid admin0 entry for ${code}`);
    }
    seenStatuses.add(entry.status);
  }

  if (data.admin1 !== undefined) {
    if (typeof data.admin1 !== 'object' || Array.isArray(data.admin1)) {
      fail('admin1 must be an object when present');
    }
    for (const [key, entry] of Object.entries(data.admin1)) {
      if (typeof key !== 'string' || key.length === 0) {
        fail('invalid admin1 key');
      }
      if (!isStatusEntry(entry)) {
        fail(`invalid admin1 entry for ${key}`);
      }
      seenStatuses.add(entry.status);
    }
  }

  const unknown = [...seenStatuses].filter((status) => !KNOWN_STATUSES.has(status));
  if (unknown.length > 0) {
    console.warn(
      `sync-starlink-availability: new status values from feed: ${unknown.join(', ')}`,
    );
  }
}

function serialize(data) {
  // Match the official feed formatting (4-space indent, no trailing newline).
  return `${JSON.stringify(data, null, 4)}`;
}

async function readExisting(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function main() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    fail(`HTTP ${response.status} fetching ${SOURCE_URL}`);
  }

  const rawText = await response.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    fail('response is not valid JSON');
  }

  validateAvailability(data);

  const nextContent = serialize(data);
  const previousContent = await readExisting(OUTPUT_PATH);
  const previousMeta = await readExisting(META_PATH);
  const changed = previousContent !== nextContent;

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });

  const meta = {
    sourceUrl: SOURCE_URL,
    mapUrl: MAP_URL,
    provider: 'SpaceX / Starlink',
    attribution:
      'Service availability data is sourced from Starlink’s public map feed and remains their material. This project is not affiliated with SpaceX or Starlink.',
    syncedAt: new Date().toISOString(),
    etag: response.headers.get('etag'),
    lastModified: response.headers.get('last-modified'),
    contentSha256: createHash('sha256').update(nextContent).digest('hex'),
    admin0Count: Object.keys(data.admin0).length,
    admin1Count: data.admin1 ? Object.keys(data.admin1).length : 0,
  };

  // Avoid weekly no-op PRs: only touch the repo when the feed (or missing meta) changes.
  if (changed) {
    await writeFile(OUTPUT_PATH, nextContent, 'utf8');
    await writeFile(META_PATH, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
  } else if (previousMeta === null) {
    await writeFile(META_PATH, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        changed,
        wroteMeta: changed || previousMeta === null,
        output: path.relative(ROOT, OUTPUT_PATH),
        meta: path.relative(ROOT, META_PATH),
        admin0Count: meta.admin0Count,
        admin1Count: meta.admin1Count,
        lastModified: meta.lastModified,
      },
      null,
      2,
    ),
  );

  process.exit(0);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
