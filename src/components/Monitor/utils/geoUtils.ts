import * as THREE from 'three';
import { hasStarlinkBanned, hasStarlinkRestricted } from '../constants/bannedCountries';


export const loadGeographicData = async () => {
    try {
        const worldResponse = await fetch('/json/ne_110m_admin_0_countries.geojson');

        if (!worldResponse.ok) {
            throw new Error(`HTTP error! status: ${worldResponse.status}`);
        }

        const worldData = await worldResponse.json();
        return worldData;
    } catch (error) {
        console.error('Errore nel caricamento dei dati geografici:', error);
    }
};

const calculatePolygonCentroid = (coordinates: number[][]): { lat: number; lon: number } => {
    if (coordinates.length < 3) {
        return {
            lat: coordinates[0]?.[1] || 0,
            lon: coordinates[0]?.[0] || 0
        };
    }

    let area = 0;
    let centroidLat = 0;
    let centroidLon = 0;

    for (let i = 0; i < coordinates.length - 1; i++) {
        const [x0, y0] = coordinates[i];
        const [x1, y1] = coordinates[i + 1];

        const a = x0 * y1 - x1 * y0;
        area += a;
        centroidLon += (x0 + x1) * a;
        centroidLat += (y0 + y1) * a;
    }

    area *= 0.5;

    if (Math.abs(area) < 1e-10) {
        let totalLat = 0;
        let totalLon = 0;
        coordinates.forEach(coord => {
            totalLon += coord[0];
            totalLat += coord[1];
        });
        return {
            lat: totalLat / coordinates.length,
            lon: totalLon / coordinates.length
        };
    }

    centroidLon = centroidLon / (6 * area);
    centroidLat = centroidLat / (6 * area);

    return {
        lat: centroidLat,
        lon: centroidLon
    };
};

const calculateFeatureCentroid = (feature: any): { lat: number; lon: number } => {
    if (!feature.geometry || !feature.geometry.coordinates) {
        return { lat: 0, lon: 0 };
    }

    const { type, coordinates } = feature.geometry;

    if (type === 'Polygon') {
        return calculatePolygonCentroid(coordinates[0]);
    } else if (type === 'MultiPolygon') {
        let largestPolygon = coordinates[0][0];
        let largestArea = 0;

        coordinates.forEach((polygon: any) => {
            const ring = polygon[0];
            let area = 0;

            for (let i = 0; i < ring.length - 1; i++) {
                const [x0, y0] = ring[i];
                const [x1, y1] = ring[i + 1];
                area += Math.abs(x0 * y1 - x1 * y0);
            }

            if (area > largestArea) {
                largestArea = area;
                largestPolygon = ring;
            }
        });

        return calculatePolygonCentroid(largestPolygon);
    }

    return { lat: 0, lon: 0 };
};

const geoToCartesian = (lat: number, lon: number, radius: number = 5.02): THREE.Vector3 => {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = -lon * Math.PI / 180;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
};

const createTextTexture = (text: string, category: 'normal' | 'restricted' | 'banned'): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Error');
    }

    canvas.width = 512;
    canvas.height = 128;

    context.font = 'bold 2rem Nimbus, system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    let textColor: string;
    switch (category) {
        case 'banned':
            textColor = '#ff0000';
            break;
        case 'restricted':
            textColor = '#ff8800';
            break;
        default:
            textColor = '#ffffff';
            break;
    }

    context.strokeStyle = '#000000';
    context.lineWidth = 4;
    context.strokeText(text, canvas.width / 2, canvas.height / 2);

    context.fillStyle = textColor;
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
};

const EXCLUDED_COUNTRIES = new Set([
    'Israel', 'Palestine', 'Palestinian Territory', 'West Bank', 'Gaza Strip',
    'Gaza', 'Palestinian Territories', 'State of Palestine'
]);

const shouldExcludeCountry = (name: string): boolean => {
    return EXCLUDED_COUNTRIES.has(name);
};

const addCountryLabel = (scene: THREE.Scene, name: string, centroid: { lat: number; lon: number }, category: 'normal' | 'restricted' | 'banned') => {
    if (shouldExcludeCountry(name)) {
        return;
    }

    let displayName = name;

    const position = geoToCartesian(centroid.lat, centroid.lon);
    const texture = createTextTexture(displayName, category);

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.1,
        opacity: 0.8
    });

    const sprite = new THREE.Sprite(material);

    let scale = 1.1;

    sprite.scale.set(scale, scale * 0.25, 1);
    sprite.position.copy(position);

    sprite.renderOrder = 2000;

    scene.add(sprite);
};

export const drawGeographicBorders = (scene: THREE.Scene, geoData: any) => {
    if (!geoData || !geoData.features) {
        console.error('Dati GeoJSON non validi');
        return;
    }

    const bannedFeatures: any[] = [];
    const restrictedFeatures: any[] = [];
    const normalFeatures: any[] = [];

    geoData.features.forEach((feature: any) => {
        if (hasStarlinkBanned(feature)) {
            bannedFeatures.push(feature);
        } else if (hasStarlinkRestricted(feature)) {
            restrictedFeatures.push(feature);
        } else {
            normalFeatures.push(feature);
        }
    });

    const drawFeatures = (features: any[], category: 'normal' | 'restricted' | 'banned') => {
        features.forEach((feature: any) => {
            if (!feature.geometry || !feature.geometry.coordinates) return;

            const coordinates = feature.geometry.type === 'Polygon'
                ? [feature.geometry.coordinates]
                : feature.geometry.coordinates;

            const centroid = calculateFeatureCentroid(feature);

            const name = feature.properties?.NAME ||
                feature.properties?.name ||
                feature.properties?.ADMIN ||
                feature.properties?.NAME_EN ||
                feature.properties?.SOVEREIGNT ||
                feature.properties?.GEOUNIT ||
                feature.properties?.NAME_LONG ||
                'Unknown';

            if (name && name !== 'Unknown' && name.length > 2 &&
                !isNaN(centroid.lat) && !isNaN(centroid.lon) &&
                Math.abs(centroid.lat) <= 90 && Math.abs(centroid.lon) <= 180) {
                
                // Adjust Indonesia label position to be more central
                if (name === 'Indonesia') {
                    const indonesiaCentralCentroid = {
                        lat: -2.5,
                        lon: 118.0
                    };
                    addCountryLabel(scene, 'Indonesia', indonesiaCentralCentroid, category);
                } else {
                    addCountryLabel(scene, name, centroid, category);
                }

                if (name === 'United States of America' || name === 'United States') {
                    const continentalUSCentroid = {
                        lat: 39.8283,
                        lon: -98.5795
                    };
                    addCountryLabel(scene, 'United States', continentalUSCentroid, category);
                }

                // Add French Guiana label for France
                if (name === 'France') {
                    const frenchGuianaCentroid = {
                        lat: 3.5,
                        lon: -53.0
                    };
                    addCountryLabel(scene, 'French Guiana', frenchGuianaCentroid, 'restricted');
                }
            }

            coordinates.forEach((polygon: any) => {
                if (!polygon || !polygon[0]) return;

                const ring = polygon[0];
                const points: THREE.Vector3[] = ring.map((coord: [number, number]) => {
                    const [lon, lat] = coord;
                    const phi = (90 - lat) * Math.PI / 180;
                    const theta = -lon * Math.PI / 180;

                    let radius: number;
                    switch (category) {
                        case 'banned':
                            radius = 5.015;
                            break;
                        case 'restricted':
                            radius = 5.012;
                            break;
                        default:
                            radius = 5.01;
                            break;
                    }

                    const x = radius * Math.sin(phi) * Math.cos(theta);
                    const y = radius * Math.cos(phi);
                    const z = radius * Math.sin(phi) * Math.sin(theta);
                    return new THREE.Vector3(x, y, z);
                });

                if (points.length > 0) {
                    points.push(points[0]);

                    const geometry = new THREE.BufferGeometry().setFromPoints(points);

                    let lineColor: number;
                    let lineWidth = 1;
                    let opacity = 0.8;
                    let renderOrder = 0;

                    switch (category) {
                        case 'banned':
                            lineColor = 0xff0000;
                            lineWidth = 3;
                            opacity = 1.0;
                            renderOrder = 1000;
                            break;
                        case 'restricted':
                            lineColor = 0xff8800;
                            lineWidth = 2;
                            opacity = 0.9;
                            renderOrder = 500;
                            break;
                        default:
                            lineColor = 0xffffff;
                            lineWidth = 1;
                            opacity = 0.6;
                            renderOrder = 0;
                            break;
                    }

                    const lineMaterial = new THREE.LineBasicMaterial({
                        color: lineColor,
                        opacity: opacity,
                        transparent: true,
                        linewidth: lineWidth,
                        depthWrite: category !== 'normal',
                        depthTest: true
                    });

                    const borderLine = new THREE.Line(geometry, lineMaterial);
                    borderLine.renderOrder = renderOrder;

                    scene.add(borderLine);
                }
            });
        });
    };

    drawFeatures(normalFeatures, 'normal');
    drawFeatures(restrictedFeatures, 'restricted');
    drawFeatures(bannedFeatures, 'banned');
};