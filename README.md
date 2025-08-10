# Starmonitor

3D visualization of Starlink satellites orbiting Earth using React, Three.js, and CelesTrak live satellite data.

## Features

- Live satellite tracking with real-time position updates
- Interactive 3D Earth globe with mouse controls
- Country borders with highlighting for Starlink-restricted regions
- Real-time satellite counter

## Tech Stack

- React 18 + TypeScript
- Three.js for 3D rendering
- satellite.js for orbital calculations
- Real TLE data from CelesTrak

## Quick Start

```bash
git clone <repository-url>
cd starmonitor
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## How It Works

The app fetches Two-Line Element (TLE) data from CelesTrak and uses the satellite.js library to calculate real-time satellite positions. Country borders are rendered from GeoJSON data, with restricted regions highlighted in red.

## Browser Support

Modern browsers with WebGL support (Chrome, Firefox, Safari, Edge).

## License

MIT License