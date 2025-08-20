# Starmonitor

3D visualization of Starlink satellites orbiting Earth using React, Three.js, and live data from CelesTrak (satellites) and Starlink (service availability) APIs.

## Features

- **Live Satellite Tracking**: Real-time position updates for all Starlink satellites
- **Interactive 3D Earth**: Mouse-controlled globe with orbital visualization
- **Service Availability Map**: Real-time Starlink service status by country using official API
- **Dynamic Country Classification**:
  - ⚪ **Available**: Countries with active Starlink service
  - 🔵 **Coming Soon**: Countries with planned service rollout
  - 🟠 **Waiting List**: Countries pending regulatory approval
  - 🔴 **Unavailable**: Countries without service access
- **Mobile Responsive**: Optimized for desktop, tablet, and mobile devices
- **Real-time Counter**: Live satellite count display

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **3D Rendering**: Three.js with WebGL
- **Orbital Calculations**: satellite.js library
- **Data Sources**:
  - Satellite TLE data from CelesTrak API
  - Service availability from official Starlink API
  - Country borders from GeoJSON data

## Quick Start

```bash
git clone <repository-url>
cd starmonitor
npm install
npm run dev
```

Open `http://localhost:5174` in your browser.

## How It Works

The application combines multiple real-time data sources:

1. **Satellite Positions**: Fetches Two-Line Element (TLE) data from CelesTrak and calculates precise orbital positions using satellite.js
2. **Service Availability**: Queries the official Starlink API for current service status by country
3. **Geographic Visualization**: Renders country borders from GeoJSON data with dynamic color coding based on service availability
4. **Real-time Updates**: Satellite positions update every second, service data refreshes on load

## Browser Support

Modern browsers with WebGL support (Chrome, Firefox, Safari, Edge).

## License

MIT License