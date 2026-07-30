# Third-party data notice

## Starlink service availability (`public/json/availability.json`)

This file is periodically mirrored from Starlink’s public map feed:

- https://api.starlink.com/public-files/availability.json
- Used by https://www.starlink.com/map

SpaceX / Starlink retain rights in their materials. Starmonitor is **not
affiliated with, endorsed by, or sponsored by** SpaceX or Starlink.

There is no published open license granting third parties an API right to this
feed. The local copy exists only so the globe visualization can show publicly
posted service-availability facts without browser hotlinking and without
hammering their CDN.

Automation policy used by this repository:

1. Fetch the public JSON only (no HTML scraping, no authenticated APIs).
2. Identify requests with a clear project User-Agent.
3. Fetch at low frequency (weekly GitHub Action, plus manual runs).
4. Keep attribution / sync metadata in `public/json/availability.meta.json`.
5. Disable the sync workflow if Starlink asks or the feed becomes restricted.

The MIT License in `LICENSE.md` applies to Starmonitor’s own code, not to
Starlink’s availability data.
