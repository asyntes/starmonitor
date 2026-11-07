import * as THREE from 'three';
import * as satellite from 'satellite.js';
import {
    parseTLEText,
    mergeSupGpWithGpFallback,
    type TLEData,
} from '@/src/lib/tle';

export { parseTLEText, mergeSupGpWithGpFallback };
export type { TLEData };

interface PositionAndVelocity {
    position?: { x: number; y: number; z: number };
    velocity?: { x: number; y: number; z: number };
    error?: string;
}

export const getSatellitePosition = (satrec: satellite.SatRec, date: Date): THREE.Vector3 | null => {
    const positionAndVelocity = satellite.propagate(satrec, date) as PositionAndVelocity | boolean;
    if (typeof positionAndVelocity !== 'object' || !positionAndVelocity || !positionAndVelocity.position) {
        return null;
    }
    const positionEci = positionAndVelocity.position;
    const gmst = satellite.gstime(date);
    const geodetic = satellite.eciToGeodetic(positionEci, gmst);
    const latitude = satellite.degreesLat(geodetic.latitude);
    const longitude = satellite.degreesLong(geodetic.longitude);
    if (isNaN(latitude) || isNaN(longitude)) {
        return null;
    }
    const phi = (90 - latitude) * Math.PI / 180;
    const theta = -longitude * Math.PI / 180;
    const radius = 5.2;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
};

export const createCircleTexture = (): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.beginPath();
        ctx.arc(8, 8, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
};

export const fetchTLEData = async (): Promise<TLEData[]> => {
    const response = await fetch('/api/tle');

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const records = (await response.json()) as TLEData[];
    if (!Array.isArray(records) || records.length === 0) {
        throw new Error('Empty TLE response');
    }

    return records;
};

export const createSatellitePoints = (scene: THREE.Scene, tleData: TLEData[]) => {
    const posArray: number[] = [];
    const satrecs: satellite.SatRec[] = [];

    tleData.forEach((sat) => {
        const tleLine1 = sat.tleLine1;
        const tleLine2 = sat.tleLine2;
        if (tleLine1 && tleLine2) {
            try {
                const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
                const position = getSatellitePosition(satrec, new Date());
                if (position) {
                    posArray.push(position.x, position.y, position.z);
                    satrecs.push(satrec);
                }
            } catch (error) {
                console.error('Errore calcolo posizione satellite:', error);
            }
        }
    });

    const positions = new Float32Array(posArray);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x00ff00,
        size: 0.01,
        map: createCircleTexture(),
        transparent: true,
        alphaTest: 0.5
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    return { positions, satrecs, geometry };
};
