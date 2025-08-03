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

        // Inizializza scena, camera e renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        currentMount.appendChild(renderer.domElement);

        // Crea skybox minimalista e pulita stile satellitemap.space
        const createCleanSpaceSkybox = () => {
            const skyboxGeometry = new THREE.SphereGeometry(1000, 60, 40);

            // Crea texture minimalista e pulita
            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // Sfondo gradiente spazio profondo molto sottile
                const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
                gradient.addColorStop(0, '#0a0a0f');
                gradient.addColorStop(0.5, '#000000');
                gradient.addColorStop(1, '#0a0a0f');

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 2048, 1024);

                // Stelle minimaliste e sparse
                ctx.fillStyle = '#ffffff';
                for (let i = 0; i < 800; i++) {
                    const x = Math.random() * 2048;
                    const y = Math.random() * 1024;
                    const brightness = Math.random();

                    if (brightness > 0.98) {
                        // Stelle molto luminose (rare)
                        ctx.globalAlpha = 0.9;
                        ctx.beginPath();
                        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (brightness > 0.9) {
                        // Stelle luminose
                        ctx.globalAlpha = 0.7;
                        ctx.beginPath();
                        ctx.arc(x, y, 1, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (brightness > 0.7) {
                        // Stelle normali
                        ctx.globalAlpha = 0.5;
                        ctx.beginPath();
                        ctx.arc(x, y, 0.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                // Via Lattea molto sottile e discreta
                ctx.globalAlpha = 0.15;
                const milkyWayY = 512;
                const milkyWayHeight = 80;

                const milkyWayGradient = ctx.createLinearGradient(0, milkyWayY - milkyWayHeight / 2, 0, milkyWayY + milkyWayHeight / 2);
                milkyWayGradient.addColorStop(0, 'transparent');
                milkyWayGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
                milkyWayGradient.addColorStop(1, 'transparent');

                ctx.fillStyle = milkyWayGradient;
                ctx.fillRect(0, milkyWayY - milkyWayHeight / 2, 2048, milkyWayHeight);

                // Qualche stella più luminosa sparsa
                const brightStars = [
                    { x: 400, y: 200 },
                    { x: 800, y: 700 },
                    { x: 1200, y: 300 },
                    { x: 1600, y: 800 },
                    { x: 300, y: 600 }
                ];

                ctx.globalAlpha = 0.8;
                ctx.fillStyle = '#ffffff';
                brightStars.forEach(star => {
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
                    ctx.fill();

                    // Bagliore sottile
                    ctx.globalAlpha = 0.3;
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 0.8;
                });
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
            console.log('Skybox pulita stile satellitemap.space creata');
        };

        // Crea la skybox pulita e minimalista
        createCleanSpaceSkybox();

        // Aggiungi luci per profondità
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 3, 5);
        scene.add(directionalLight);

        // Loader per texture
        const loader = new THREE.TextureLoader();

        // Carica texture principale e normal map per rilievi
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

        // Funzione per creare texture circolare
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

        // Funzione per calcolare la posizione del satellite
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

        // Fetch GeoJSON e rendering confini come linee
        fetch('https://geojson.xyz/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson')
            .then(response => response.json())
            .then((data: any) => {
                console.log('GeoJSON caricato:', data.features.length, 'paesi');
                data.features.forEach((feature: any) => {
                    const coordinates = feature.geometry.type === 'Polygon'
                        ? [feature.geometry.coordinates]
                        : feature.geometry.coordinates;

                    coordinates.forEach((polygon: any) => {
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

                        points.push(points[0]);

                        const geometry = new THREE.BufferGeometry().setFromPoints(points);
                        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
                        const borderLine = new THREE.Line(geometry, lineMaterial);
                        scene.add(borderLine);
                    });
                });

                // Fetch real-time TLE da Celestrak con proxy CORS
                const celestrakUrl = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle';
                fetch(`https://corsproxy.io/?${encodeURIComponent(celestrakUrl)}`)
                    .then(response => response.text())
                    .then(tleText => {
                        // Parse TLE text in array
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

                        // Usa tutti i TLE, rappresentati come punti per efficienza
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

                        // Aggiorna il contatore dei satelliti
                        setSatelliteCount(satrecs.length);
                        setIsLoading(false);

                        console.log('Satelliti plottati:', satrecs.length);

                        // Crea un singolo oggetto Points per tutti i satelliti
                        const positions = new Float32Array(posArray);
                        const geometry = new THREE.BufferGeometry();
                        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                        const material = new THREE.PointsMaterial({
                            color: 0xffa500,
                            size: 0.05,
                            map: createCircleTexture(),
                            transparent: true,
                            alphaTest: 0.5
                        });
                        const points = new THREE.Points(geometry, material);
                        scene.add(points);

                        // Aggiornamento real-time ogni secondo
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
                            // Aggiorna il contatore se necessario
                            setSatelliteCount(activeCount);
                        }, 1000);

                        return () => clearInterval(interval);
                    })
                    .catch(error => {
                        console.error('Errore fetch TLE:', error);
                        setIsLoading(false);
                    });
            })
            .catch(error => {
                console.error('Errore fetch GeoJSON:', error);
                setIsLoading(false);
            });

        camera.position.z = 10;

        // Aggiungi controlli interattivi
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 5;
        controls.maxDistance = 50;
        controls.enablePan = false;
        controls.enableZoom = false;

        // Funzione di animazione
        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            // Rotazione lenta del globo
            scene.rotation.y += 0.001;

            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Gestisci ridimensionamento finestra
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
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