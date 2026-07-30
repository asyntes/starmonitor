# Starmonitor

3D visualization of Starlink satellites orbiting Earth using Next.js, React, Three.js and live satellite data from CelesTrak.
## Features

- **Live Satellite Tracking**: Real-time position updates for all Starlink satellites
- **Interactive 3D Earth**: Mouse-controlled globe with orbital visualization
- **Service Availability Map**: Starlink service status by country (synced from Starlink’s public map feed)
- **Dynamic Country Classification**:
  - **Available**: Countries with active Starlink service
  - **Coming Soon**: Countries with planned service rollout
  - **Unavailable**: Countries without service access
- **Mobile Responsive**: Optimized for desktop, tablet, and mobile devices
- **Real-time Counter**: Live satellite count display
- **UFO Easter Egg**: Hidden UFO that occasionally appears with realistic abduction behavior - approaches Earth, hovers, tilts and activates tractor beam, then leaves

## Tech Stack

- **Framework**: Next.js 16 (with Turbopack)
- **Frontend**: React 19 + TypeScript
- **3D Rendering**: Three.js with WebGL
- **Orbital Calculations**: satellite.js library
- **Data Sources**:
  - Satellite TLE data from CelesTrak API
  - Service availability from Starlink’s public map feed (`availability.json`), mirrored locally
  - Country borders from GeoJSON data

## Quick Start

```bash
git clone <repository-url>
cd starmonitor
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Build & Deploy

```bash
npm run build    # Build for production
npm run start    # Start production server
```

## How It Works

The application combines multiple data sources:

1. **Satellite Positions**: Fetches Two-Line Element (TLE) data from CelesTrak and calculates precise orbital positions using satellite.js
2. **Service Availability**: Loads locally mirrored Starlink map availability data (see below)
3. **Geographic Visualization**: Renders country borders from GeoJSON data with dynamic color coding based on service availability
4. **Real-time Updates**: Satellite positions update every second; availability data is refreshed by the weekly sync workflow

## Availability data sync

Country service status comes from Starlink’s public map feed
(`https://api.starlink.com/public-files/availability.json`), the same JSON used
by [starlink.com/map](https://www.starlink.com/map).

This is **not** an official Starlink developer API and Starmonitor is **not
affiliated with SpaceX/Starlink**. The feed is mirrored infrequently (weekly
GitHub Action + manual runs), attributed in-repo, and served from
`public/json/availability.json` so browsers never hotlink Starlink’s CDN.

```bash
npm run sync:availability
```

Details: `public/json/DATA_NOTICE.md`. Disable
`.github/workflows/sync-starlink-availability.yml` if the provider objects.

## Browser Support

Modern browsers with WebGL support (Chrome, Firefox, Safari, Edge).

## License

MIT License for Starmonitor code (`LICENSE.md`). Starlink availability data is
third-party material; see `public/json/DATA_NOTICE.md`.
