import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as satellite from 'satellite.js';
import SatelliteCounter from '../SatelliteCounter/SatelliteCounter';

interface PositionAndVelocity {
    position?: { x: number; y: number; z: number };
    velocity?: { x: number; y: number; z: number };
    error?: string;
}

const GlobeComponent: React.FC = () => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [satelliteCount, setSatelliteCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        currentMount.appendChild(renderer.domElement);

        // Funzione per verificare se un paese/stato ha copertura Starlink
        const hasStarlinkCoverage = (feature: any): boolean => {
            if (!feature.properties) return false;

            // Controlla vari campi nome che potrebbero contenere il nome del paese/stato
            const possibleNames = [
                feature.properties.name,
                feature.properties.NAME,
                feature.properties.ADMIN,
                feature.properties.NAME_EN,
                feature.properties.SOVEREIGNT,
                feature.properties.GEOUNIT,
                feature.properties.NAME_LONG
            ].filter(Boolean);

            // Per gli stati USA, controlla separatamente
            if (feature.properties.type === 'state' ||
                possibleNames.some(name => starlinkActiveUSStates.has(name))) {
                return true;
            }

            // Per i paesi, controlla la lista principale
            return possibleNames.some(name => starlinkActiveCountries.has(name));
        };

        // Lista aggiornata dei paesi dove Starlink è attivo (Agosto 2025)
        const starlinkActiveCountries = new Set([
            // Nord America
            'United States', 'United States of America', 'USA', 'US', 'America',
            'Canada',
            'Mexico',

            // Europa
            'United Kingdom', 'UK', 'Britain', 'England', 'Scotland', 'Wales', 'Northern Ireland',
            'Germany', 'Deutschland',
            'France', 'República Francesa',
            'Italy', 'Italia',
            'Spain', 'España',
            'Netherlands', 'Nederland',
            'Poland', 'Polska',
            'Belgium', 'België',
            'Austria', 'Österreich',
            'Switzerland', 'Schweiz',
            'Ireland', 'Éire',
            'Denmark', 'Danmark',
            'Sweden', 'Sverige',
            'Norway', 'Norge',
            'Finland', 'Suomi',
            'Portugal',
            'Czech Republic', 'Czechia',
            'Hungary', 'Magyarország',
            'Slovakia', 'Slovensko',
            'Slovenia', 'Slovenija',
            'Croatia', 'Hrvatska',
            'Lithuania', 'Lietuva',
            'Latvia', 'Latvija',
            'Estonia', 'Eesti',
            'Greece', 'Ελλάδα',
            'Romania', 'România',
            'Bulgaria', 'България',
            'Ukraine', 'Україна',

            // Sud America
            'Brazil', 'Brasil',
            'Chile',
            'Argentina',
            'Colombia',
            'Peru', 'Perú',
            'Ecuador',
            'Uruguay',
            'Paraguay',
            'Bolivia',

            // Centro America & Caraibi
            'Guatemala',
            'Honduras',
            'El Salvador',
            'Nicaragua',
            'Costa Rica',
            'Panama', 'Panamá',
            'Dominican Republic', 'República Dominicana',
            'Jamaica',

            // Asia-Pacifico
            'Japan', 'Nippon', '日本',
            'Australia',
            'New Zealand', 'Aotearoa',
            'Philippines', 'Pilipinas',
            'Malaysia',
            'Indonesia',
            'Thailand', 'ประเทศไทย',
            'Singapore',
            'Mongolia',

            // Africa
            'Nigeria',
            'Kenya',
            'Rwanda',
            'Mozambique',
            'Malawi',
            'Zambia',
            'Zimbabwe',
            'Ghana',
            'South Sudan',
            'Somalia',
            'Botswana',
            'Eswatini', 'Swaziland',
            'Benin',
            'Mauritius',
            'Madagascar',
            'Angola',
            'Democratic Republic of the Congo', 'DRC', 'Congo (Kinshasa)',

            // Medio Oriente
            'Israel', 'ישראל',
            'Qatar',
            'Bahrain',
            'Oman',
            'Jordan', 'الأردن',
            'Yemen',
            'Kuwait',

            // Isole e Territori
            'Fiji',
            'Tonga',
            'Samoa',
            'Solomon Islands',
            'Vanuatu',
            'Cook Islands',
            'French Polynesia',
            'Greenland', 'Grønland',
            'Faroe Islands', 'Føroyar',
            'Iceland', 'Ísland',
            'Puerto Rico',
            'US Virgin Islands',
            'Guam',
            'American Samoa',
            'Easter Island'
        ]);

        // Lista degli stati USA (per copertura più dettagliata)
        const starlinkActiveUSStates = new Set([
            'California', 'Texas', 'Florida', 'New York', 'Pennsylvania', 'Illinois', 'Ohio',
            'Georgia', 'North Carolina', 'Michigan', 'New Jersey', 'Virginia', 'Washington',
            'Arizona', 'Massachusetts', 'Tennessee', 'Indiana', 'Missouri', 'Maryland',
            'Wisconsin', 'Colorado', 'Minnesota', 'South Carolina', 'Alabama', 'Louisiana',
            'Kentucky', 'Oregon', 'Oklahoma', 'Connecticut', 'Utah', 'Iowa', 'Nevada',
            'Arkansas', 'Mississippi', 'Kansas', 'New Mexico', 'Nebraska', 'West Virginia',
            'Idaho', 'Hawaii', 'New Hampshire', 'Maine', 'Montana', 'Rhode Island',
            'Delaware', 'South Dakota', 'North Dakota', 'Alaska', 'Vermont', 'Wyoming'
        ]);

        const createCleanSpaceSkybox = () => {
            const starlinkActiveCountries = new Set([
                // Nord America
                'United States', 'United States of America', 'USA', 'US', 'America',
                'Canada',
                'Mexico',

                // Europa
                'United Kingdom', 'UK', 'Britain', 'England', 'Scotland', 'Wales', 'Northern Ireland',
                'Germany', 'Deutschland',
                'France', 'República Francesa',
                'Italy', 'Italia',
                'Spain', 'España',
                'Netherlands', 'Nederland',
                'Poland', 'Polska',
                'Belgium', 'België',
                'Austria', 'Österreich',
                'Switzerland', 'Schweiz',
                'Ireland', 'Éire',
                'Denmark', 'Danmark',
                'Sweden', 'Sverige',
                'Norway', 'Norge',
                'Finland', 'Suomi',
                'Portugal',
                'Czech Republic', 'Czechia',
                'Hungary', 'Magyarország',
                'Slovakia', 'Slovensko',
                'Slovenia', 'Slovenija',
                'Croatia', 'Hrvatska',
                'Lithuania', 'Lietuva',
                'Latvia', 'Latvija',
                'Estonia', 'Eesti',
                'Greece', 'Ελλάδα',
                'Romania', 'România',
                'Bulgaria', 'България',
                'Ukraine', 'Україна',

                // Sud America
                'Brazil', 'Brasil',
                'Chile',
                'Argentina',
                'Colombia',
                'Peru', 'Perú',
                'Ecuador',
                'Uruguay',
                'Paraguay',
                'Bolivia',

                // Centro America & Caraibi
                'Guatemala',
                'Honduras',
                'El Salvador',
                'Nicaragua',
                'Costa Rica',
                'Panama', 'Panamá',
                'Dominican Republic', 'República Dominicana',
                'Jamaica',

                // Asia-Pacifico
                'Japan', 'Nippon', '日本',
                'Australia',
                'New Zealand', 'Aotearoa',
                'Philippines', 'Pilipinas',
                'Malaysia',
                'Indonesia',
                'Thailand', 'ประเทศไทย',
                'Singapore',
                'Mongolia',

                // Africa
                'Nigeria',
                'Kenya',
                'Rwanda',
                'Mozambique',
                'Malawi',
                'Zambia',
                'Zimbabwe',
                'Ghana',
                'South Sudan',
                'Somalia',
                'Botswana',
                'Eswatini', 'Swaziland',
                'Benin',
                'Mauritius',
                'Madagascar',
                'Angola',
                'Democratic Republic of the Congo', 'DRC', 'Congo (Kinshasa)',

                // Medio Oriente
                'Israel', 'ישראל',
                'Qatar',
                'Bahrain',
                'Oman',
                'Jordan', 'الأردن',
                'Yemen',
                'Kuwait',

                // Isole e Territori
                'Fiji',
                'Tonga',
                'Samoa',
                'Solomon Islands',
                'Vanuatu',
                'Cook Islands',
                'French Polynesia',
                'Greenland', 'Grønland',
                'Faroe Islands', 'Føroyar',
                'Iceland', 'Ísland',
                'Puerto Rico',
                'US Virgin Islands',
                'Guam',
                'American Samoa',
                'Easter Island'
            ]);

            // Lista degli stati USA (per copertura più dettagliata)
            const starlinkActiveUSStates = new Set([
                'California', 'Texas', 'Florida', 'New York', 'Pennsylvania', 'Illinois', 'Ohio',
                'Georgia', 'North Carolina', 'Michigan', 'New Jersey', 'Virginia', 'Washington',
                'Arizona', 'Massachusetts', 'Tennessee', 'Indiana', 'Missouri', 'Maryland',
                'Wisconsin', 'Colorado', 'Minnesota', 'South Carolina', 'Alabama', 'Louisiana',
                'Kentucky', 'Oregon', 'Oklahoma', 'Connecticut', 'Utah', 'Iowa', 'Nevada',
                'Arkansas', 'Mississippi', 'Kansas', 'New Mexico', 'Nebraska', 'West Virginia',
                'Idaho', 'Hawaii', 'New Hampshire', 'Maine', 'Montana', 'Rhode Island',
                'Delaware', 'South Dakota', 'North Dakota', 'Alaska', 'Vermont', 'Wyoming'
            ]);
            const skyboxGeometry = new THREE.SphereGeometry(1000, 60, 40);

            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, 2048, 1024);

                ctx.fillStyle = '#ffffff';

                for (let i = 0; i < 4000; i++) {
                    const x = Math.floor(Math.random() * 2048);
                    const y = Math.floor(Math.random() * 1024);
                    const brightness = Math.random();

                    if (brightness > 0.999) {
                        ctx.globalAlpha = 0.4;
                        ctx.beginPath();
                        ctx.arc(x + 0.5, y + 0.5, 0.02, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (brightness > 0.995) {
                        ctx.globalAlpha = 0.25;
                        ctx.beginPath();
                        ctx.arc(x + 0.5, y + 0.5, 0.015, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        ctx.globalAlpha = Math.random() * 0.15 + 0.05;
                        ctx.fillRect(x, y, 1, 1);
                    }
                }

                for (let i = 0; i < 2000; i++) {
                    const x = Math.floor(Math.random() * 2048);
                    const y = Math.floor(Math.random() * 1024);
                    ctx.globalAlpha = Math.random() * 0.05 + 0.01;
                    ctx.fillRect(x, y, 1, 1);
                }
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.mapping = THREE.EquirectangularReflectionMapping;

            const skyboxMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.BackSide,
                fog: false
            });

            const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
            scene.add(skybox);

            scene.background = texture;
            console.log('Skybox con stelline ultra-minuscole creata');
        };

        createCleanSpaceSkybox();

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 3, 5);
        scene.add(directionalLight);

        const loader = new THREE.TextureLoader();

        loader.load(
            'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
            (texture) => {
                loader.load(
                    'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
                    (normalMap) => {
                        const geometry = new THREE.SphereGeometry(5, 64, 64);
                        const material = new THREE.MeshPhongMaterial({
                            map: texture,
                            normalMap: normalMap,
                            normalScale: new THREE.Vector2(0.5, 0.5),
                        });
                        const earth = new THREE.Mesh(geometry, material);
                        scene.add(earth);
                    }
                );
            },
            undefined,
            (error) => console.error('Errore caricamento texture:', error)
        );

        const createCircleTexture = () => {
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

        const getSatellitePosition = (satrec: any, date: Date): THREE.Vector3 | null => {
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

        // Funzione per caricare i dati geografici
        const loadGeographicData = async () => {
            try {
                // Prima carica i paesi del mondo (escludendo gli USA)
                const worldResponse = await fetch('https://geojson.xyz/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson');
                const worldData = await worldResponse.json();

                // Filtra i dati mondiali per escludere gli USA
                const worldWithoutUSA = {
                    type: "FeatureCollection",
                    features: worldData.features.filter((feature: any) =>
                        feature.properties.NAME !== 'United States of America' &&
                        feature.properties.NAME_EN !== 'United States of America' &&
                        feature.properties.ADMIN !== 'United States of America'
                    )
                };

                console.log('Paesi mondiali caricati (senza USA):', worldWithoutUSA.features.length);

                // Poi carica gli stati USA separatamente
                let usStatesData = null;
                const usStateUrls = [
                    'https://raw.githubusercontent.com/python-visualization/folium/master/examples/data/us-states.json',
                    'https://raw.githubusercontent.com/alabarga/world-geojson/master/countries/USA/states.json',
                    'https://d3js.org/us-10m.v1.json', // TopoJSON, necessita conversione
                    'https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json'
                ];

                for (const url of usStateUrls) {
                    try {
                        console.log(`Tentando caricamento stati USA da: ${url}`);
                        const response = await fetch(url);
                        if (response.ok) {
                            const data = await response.json();

                            // Controlla se è TopoJSON o GeoJSON
                            if (data.type === 'Topology') {
                                console.log('Formato TopoJSON rilevato, conversione necessaria');
                                // Per ora salta i TopoJSON, prova il prossimo URL
                                continue;
                            } else if (data.type === 'FeatureCollection') {
                                usStatesData = data;
                                console.log(`Stati USA caricati da: ${url}, stati trovati: ${data.features.length}`);
                                break;
                            }
                        }
                    } catch (error) {
                        console.log(`Fallito caricamento stati USA da ${url}:`, error);
                    }
                }

                // Se non riesce a caricare gli stati USA, usa un GeoJSON hardcoded semplificato
                if (!usStatesData) {
                    console.log('Usando fallback per stati USA...');
                    // Questo è un fallback con coordinate semplici per alcuni stati principali
                    usStatesData = {
                        type: "FeatureCollection",
                        features: [
                            // California (semplificato)
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
                            // Texas (semplificato)
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
                            // Florida (semplificato)
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
                            // New York (semplificato)
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

                // Combina mondo + stati USA
                const combinedGeoData = {
                    type: "FeatureCollection",
                    features: [...worldWithoutUSA.features, ...usStatesData.features]
                };

                return combinedGeoData;

                return combinedGeoData;
            } catch (error) {
                console.error('Errore nel caricamento dei dati geografici:', error);
                // Fallback finale al GeoJSON originale
                const response = await fetch('https://geojson.xyz/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson');
                return await response.json();
            }
        };

        // Funzione per disegnare i confini geografici
        const drawGeographicBorders = (geoData: any) => {
            if (!geoData || !geoData.features) {
                console.error('Dati GeoJSON non validi');
                return;
            }

            console.log('Funzioni geografiche da disegnare:', geoData.features.length);

            geoData.features.forEach((feature: any, index: number) => {
                if (!feature.geometry || !feature.geometry.coordinates) return;

                // Debug: stampa info sulla feature
                if (index < 5) {
                    console.log(`Feature ${index}:`, {
                        name: feature.properties?.name || feature.properties?.NAME || feature.properties?.ADMIN,
                        type: feature.properties?.type,
                        geometryType: feature.geometry.type
                    });
                }

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
                        const radius = 5.01;
                        const x = radius * Math.sin(phi) * Math.cos(theta);
                        const y = radius * Math.cos(phi);
                        const z = radius * Math.sin(phi) * Math.sin(theta);
                        return new THREE.Vector3(x, y, z);
                    });

                    if (points.length > 0) {
                        points.push(points[0]); // Chiudi il poligono

                        const geometry = new THREE.BufferGeometry().setFromPoints(points);

                        // Determina il colore in base alla copertura Starlink
                        let lineColor = 0xcccccc; // Grigio per paesi senza Starlink
                        let lineWidth = 1;

                        if (feature.properties) {
                            const hasStarlink = hasStarlinkCoverage(feature);

                            if (hasStarlink) {
                                lineColor = 0x00ff00; // Verde per paesi/stati con Starlink
                                lineWidth = 2;

                                // Log per debug
                                const displayName = feature.properties.name ||
                                    feature.properties.NAME ||
                                    feature.properties.ADMIN ||
                                    'Unknown';
                                console.log('Starlink attivo trovato:', displayName);
                            } else {
                                // Stati USA senza Starlink (in rosso per distinguere)
                                if (feature.properties.type === 'state') {
                                    lineColor = 0xff6666; // Rosso per stati USA senza Starlink
                                }
                                // Altri paesi restano grigi
                            }
                        }

                        const lineMaterial = new THREE.LineBasicMaterial({
                            color: lineColor,
                            opacity: 0.8,
                            transparent: true,
                            linewidth: lineWidth
                        });
                        const borderLine = new THREE.Line(geometry, lineMaterial);
                        scene.add(borderLine);
                    }
                });
            });
        };

        // Carica i dati geografici e disegna i confini
        loadGeographicData().then((geoData) => {
            drawGeographicBorders(geoData);
            // Dopo aver caricato i confini, carica i satelliti
            const celestrakUrl = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle';
            fetch(`https://corsproxy.io/?${encodeURIComponent(celestrakUrl)}`)
                .then(response => response.text())
                .then(tleText => {
                    const lines = tleText.trim().split('\n');
                    const starlinkTLEs = [];
                    for (let i = 0; i < lines.length; i += 3) {
                        if (lines[i] && lines[i + 1] && lines[i + 2]) {
                            starlinkTLEs.push({
                                name: lines[i].trim(),
                                tleLine1: lines[i + 1].trim(),
                                tleLine2: lines[i + 2].trim(),
                            });
                        }
                    }
                    console.log('TLE Starlink fetchati:', starlinkTLEs.length);

                    let posArray: number[] = [];
                    let satrecs: any[] = [];
                    starlinkTLEs.forEach((sat) => {
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

                    setSatelliteCount(satrecs.length);
                    setIsLoading(false);

                    console.log('Satelliti plottati:', satrecs.length);

                    const positions = new Float32Array(posArray);
                    const geometry = new THREE.BufferGeometry();
                    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                    const material = new THREE.PointsMaterial({
                        color: 0xffa500,
                        size: 0.03,
                        map: createCircleTexture(),
                        transparent: true,
                        alphaTest: 0.5
                    });
                    const points = new THREE.Points(geometry, material);
                    scene.add(points);

                    const interval = setInterval(() => {
                        const date = new Date();
                        let activeCount = 0;
                        satrecs.forEach((satrec, i) => {
                            const pos = getSatellitePosition(satrec, date);
                            if (pos) {
                                positions[i * 3] = pos.x;
                                positions[i * 3 + 1] = pos.y;
                                positions[i * 3 + 2] = pos.z;
                                activeCount++;
                            }
                        });
                        geometry.attributes.position.needsUpdate = true;
                        setSatelliteCount(activeCount);
                    }, 1000);

                    return () => clearInterval(interval);
                })
                .catch(error => {
                    console.error('Errore fetch TLE:', error);
                    setIsLoading(false);
                });
        });

        camera.position.z = 10;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 7;
        controls.maxDistance = 20;
        controls.enablePan = false;

        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            scene.rotation.y += 0.001;

            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (currentMount) {
                currentMount.removeChild(renderer.domElement);
            }
            cancelAnimationFrame(animationFrameId);
            controls.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <>
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
            <SatelliteCounter count={satelliteCount} isLoading={isLoading} />
        </>
    );
};

export default GlobeComponent;