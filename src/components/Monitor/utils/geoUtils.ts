import * as THREE from 'three';
import { hasStarlinkBanned, hasStarlinkRestricted } from '../constants/bannedCountries';

export const loadGeographicData = async () => {
    try {
        const worldResponse = await fetch('https://geojson.xyz/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson');
        const worldData = await worldResponse.json();

        const worldWithoutUSA = {
            type: "FeatureCollection",
            features: worldData.features.filter((feature: any) =>
                feature.properties.NAME !== 'United States of America' &&
                feature.properties.NAME_EN !== 'United States of America' &&
                feature.properties.ADMIN !== 'United States of America'
            )
        };

        let usStatesData = null;
        const usStateUrls = [
            'https://raw.githubusercontent.com/python-visualization/folium/master/examples/data/us-states.json',
            'https://raw.githubusercontent.com/alabarga/world-geojson/master/countries/USA/states.json',
            'https://d3js.org/us-10m.v1.json',
            'https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json'
        ];

        for (const url of usStateUrls) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();

                    if (data.type === 'Topology') {
                        continue;
                    } else if (data.type === 'FeatureCollection') {
                        usStatesData = data;
                        break;
                    }
                }
            } catch (error) {
                console.log(error);
            }
        }

        if (!usStatesData) {
            usStatesData = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        properties: { name: "California", type: "state" },
                        geometry: {
                            type: "Polygon",
                            coordinates: [[
                                [-124.4, 42.0], [-124.4, 32.5], [-114.1, 32.5],
                                [-114.1, 42.0], [-124.4, 42.0]
                            ]]
                        }
                    },
                    {
                        type: "Feature",
                        properties: { name: "Texas", type: "state" },
                        geometry: {
                            type: "Polygon",
                            coordinates: [[
                                [-106.6, 31.8], [-93.5, 31.8], [-93.5, 36.5],
                                [-106.6, 36.5], [-106.6, 31.8]
                            ]]
                        }
                    },
                    {
                        type: "Feature",
                        properties: { name: "Florida", type: "state" },
                        geometry: {
                            type: "Polygon",
                            coordinates: [[
                                [-87.6, 24.5], [-80.0, 24.5], [-80.0, 31.0],
                                [-87.6, 31.0], [-87.6, 24.5]
                            ]]
                        }
                    },
                    {
                        type: "Feature",
                        properties: { name: "New York", type: "state" },
                        geometry: {
                            type: "Polygon",
                            coordinates: [[
                                [-79.8, 40.5], [-71.9, 40.5], [-71.9, 45.0],
                                [-79.8, 45.0], [-79.8, 40.5]
                            ]]
                        }
                    }
                ]
            };
        }

        const combinedGeoData = {
            type: "FeatureCollection",
            features: [...worldWithoutUSA.features, ...usStatesData.features]
        };

        return combinedGeoData;
    } catch (error) {
        console.error('Errore nel caricamento dei dati geografici:', error);
        const response = await fetch('https://geojson.xyz/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson');
        return await response.json();
    }
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