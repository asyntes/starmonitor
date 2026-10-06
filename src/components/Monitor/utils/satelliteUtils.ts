import * as THREE from 'three';
import * as satellite from 'satellite.js';

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

interface TLEData {
    name: string;
    tleLine1: string;
    tleLine2: string;
}

// SupGP elements are fitted by CelesTrak from SpaceX ephemerides.
// They use the same 3-line TLE layout as the 18 SDS GP set (classification "C"
// instead of "U"), so satellite.js propagation stays unchanged.
// https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=starlink&FORMAT=tle
const CELESTRAK_SUP_GP_URL =
    'https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=starlink&FORMAT=tle';
const CELESTRAK_GP_URL =
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle';

const celestrakRequestUrl = (celestrakUrl: string): string => {
    // In development: use CORS proxy
    // In production: use direct HTTPS URL (this code block gets removed in production build)
    if (process.env.NODE_ENV === 'development') {
        return `https://corsproxy.io/?${encodeURIComponent(celestrakUrl)}`;
    }
    return celestrakUrl;
};

const catalogNumber = (sat: TLEData): string | null => {
    const line1 = sat.tleLine1;
    const line2 = sat.tleLine2;
    if (line1.length < 7 || line2.length < 7) return null;
    const id = line1.slice(2, 7);
    if (id !== line2.slice(2, 7) || !/\d/.test(id)) return null;
    return id;
};

export const parseTLEText = (tleText: string): TLEData[] => {
    const lines = tleText.trim().split(/\r?\n/);
    const records: TLEData[] = [];

    for (let i = 0; i < lines.length; i += 3) {
        const name = lines[i]?.trim();
        const tleLine1 = lines[i + 1]?.trim();
        const tleLine2 = lines[i + 2]?.trim();
        if (!name || !tleLine1 || !tleLine2) continue;
        if (!tleLine1.startsWith('1 ') || !tleLine2.startsWith('2 ')) continue;

        const record = { name, tleLine1, tleLine2 };
        if (!catalogNumber(record)) continue;
        records.push(record);
    }

    return records;
};

// Prefer SupGP. Keep a GP element only when that catalog number has no SupGP.
export const mergeSupGpWithGpFallback = (supGp: TLEData[], gp: TLEData[]): TLEData[] => {
    const seen = new Set<string>();
    const selected: TLEData[] = [];

    const take = (records: TLEData[]) => {
        for (const sat of records) {
            const id = catalogNumber(sat);
            if (!id || seen.has(id)) continue;
            seen.add(id);
            selected.push(sat);
        }
    };

    take(supGp);
    take(gp);
    return selected;
};

const fetchTLESource = async (celestrakUrl: string): Promise<TLEData[]> => {
    const response = await fetch(celestrakRequestUrl(celestrakUrl));

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const records = parseTLEText(await response.text());
    if (records.length === 0) {
        throw new Error('Empty TLE response');
    }

    return records;
};

export const fetchTLEData = async (): Promise<TLEData[]> => {
    const [supGpResult, gpResult] = await Promise.allSettled([
        fetchTLESource(CELESTRAK_SUP_GP_URL),
        fetchTLESource(CELESTRAK_GP_URL),
    ]);

    const supGp = supGpResult.status === 'fulfilled' ? supGpResult.value : [];
    const gp = gpResult.status === 'fulfilled' ? gpResult.value : [];

    if (supGp.length === 0 && gp.length === 0) {
        console.error(
            'Error fetching TLE data:',
            supGpResult.status === 'rejected' ? supGpResult.reason : null,
            gpResult.status === 'rejected' ? gpResult.reason : null
        );
        throw new Error('Failed to fetch TLE data');
    }

    if (supGp.length === 0) {
        console.warn('SupGP unavailable, using 18 SDS GP fallback:', supGpResult.status === 'rejected' ? supGpResult.reason : 'empty');
        return gp;
    }

    if (gp.length === 0) {
        console.warn('GP fallback unavailable; using SupGP only:', gpResult.status === 'rejected' ? gpResult.reason : 'empty');
        return supGp;
    }

    const merged = mergeSupGpWithGpFallback(supGp, gp);
    const supGpIds = new Set(
        supGp.map((sat) => catalogNumber(sat)).filter((id): id is string => id !== null)
    );
    const filledFromGp = gp.filter((sat) => {
        const id = catalogNumber(sat);
        return id !== null && !supGpIds.has(id);
    }).length;
    if (filledFromGp > 0) {
        console.info(`SupGP missing ${filledFromGp} Starlink objects; filled from 18 SDS GP`);
    }

    return merged;
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