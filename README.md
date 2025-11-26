# Starmonitor

3D visualization of Starlink satellites orbiting Earth using React, Three.js and live satellite data from CelesTrak.
## Features

- **Live Satellite Tracking**: Real-time position updates for all Starlink satellites
- **Interactive 3D Earth**: Mouse-controlled globe with orbital visualization
- **Service Availability Map**: Starlink service status by country (manually updated from static data)
- **Dynamic Country Classification**:
  - **Available**: Countries with active Starlink service
  - **Coming Soon**: Countries with planned service rollout
  - **Unavailable**: Countries without service access
- **Mobile Responsive**: Optimized for desktop, tablet, and mobile devices
- **Real-time Counter**: Live satellite count display
- **UFO Easter Egg**: Hidden UFO that occasionally appears with realistic abduction behavior - approaches Earth, hovers, tilts and activates tractor beam, then leaves

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **3D Rendering**: Three.js with WebGL
- **Orbital Calculations**: satellite.js library
- **Data Sources**:
  - Satellite TLE data from CelesTrak API
  - Service availability from Starlink availability data (static JSON)
  - Country borders from GeoJSON data

## Quick Start

```bash
git clone <repository-url>
cd starmonitor
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## How It Works

The application combines multiple data sources:

1. **Satellite Positions**: Fetches Two-Line Element (TLE) data from CelesTrak and calculates precise orbital positions using satellite.js
2. **Service Availability**: Loads static service availability data from local JSON (sourced from Starlink and updated manually)
3. **Geographic Visualization**: Renders country borders from GeoJSON data with dynamic color coding based on service availability
4. **Real-time Updates**: Satellite positions update every second, service data is static and refreshed via manual updates

## Browser Support

Modern browsers with WebGL support (Chrome, Firefox, Safari, Edge).

## License

MIT License
