import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Aggiunto .js come richiesto
import * as satellite from 'satellite.js';

interface PositionAndVelocity {
    position?: { x: number; y: number; z: number };
    velocity?: { x: number; y: number; z: number };
    error?: string;
}

interface SatelliteMesh extends THREE.Mesh {
    satrec?: any;
    glowMesh?: THREE.Mesh;
}

const GlobeComponent: React.FC = () => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const satellitesMeshes = useRef<SatelliteMesh[]>([]);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        // Inizializza scena, camera e renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        currentMount.appendChild(renderer.domElement);

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

                        // Limita a 50 per performance
                        const limitedTLEs = starlinkTLEs.slice(0, 50);
                        let plotted = 0;
                        limitedTLEs.forEach((sat) => {
                            const tleLine1 = sat.tleLine1;
                            const tleLine2 = sat.tleLine2;
                            if (tleLine1 && tleLine2) {
                                try {
                                    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
                                    const updatePosition = () => {
                                        const date = new Date();
                                        const positionAndVelocity = satellite.propagate(satrec, date) as PositionAndVelocity | boolean;
                                        if (typeof positionAndVelocity === 'object' && positionAndVelocity && positionAndVelocity.position) {
                                            const positionEci = positionAndVelocity.position;
                                            const gmst = satellite.gstime(date);
                                            const geodetic = satellite.eciToGeodetic(positionEci, gmst);
                                            const latitude = satellite.degreesLat(geodetic.latitude);
                                            const longitude = satellite.degreesLong(geodetic.longitude);

                                            if (!isNaN(latitude) && !isNaN(longitude)) {
                                                const phi = (90 - latitude) * Math.PI / 180;
                                                const theta = -longitude * Math.PI / 180;
                                                const radius = 5.2;
                                                const x = radius * Math.sin(phi) * Math.cos(theta);
                                                const y = radius * Math.cos(phi);
                                                const z = radius * Math.sin(phi) * Math.sin(theta);
                                                return new THREE.Vector3(x, y, z);
                                            }
                                        }
                                        return null;
                                    };

                                    const position = updatePosition();
                                    if (position) {
                                        const satGeometry = new THREE.SphereGeometry(0.05, 8, 8);
                                        const satMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 }); // Bianco luminoso
                                        const satMesh = new THREE.Mesh(satGeometry, satMaterial) as SatelliteMesh;
                                        satMesh.position.copy(position);
                                        satMesh.satrec = satrec;
                                        scene.add(satMesh);

                                        // Glow soffuso
                                        const glowGeometry = new THREE.SphereGeometry(0.08, 8, 8);
                                        const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
                                        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
                                        glowMesh.position.copy(position);
                                        scene.add(glowMesh);
                                        satMesh.glowMesh = glowMesh;

                                        satellitesMeshes.current.push(satMesh);
                                        plotted++;
                                    }
                                } catch (error) {
                                    console.error('Errore calcolo posizione satellite:', error);
                                }
                            }
                        });
                        console.log('Satelliti plottati:', plotted);
                    })
                    .catch(error => console.error('Errore fetch TLE:', error));

                // Aggiornamento real-time ogni secondo
                const interval = setInterval(() => {
                    satellitesMeshes.current.forEach((mesh) => {
                        if (mesh.satrec) {
                            const date = new Date();
                            const positionAndVelocity = satellite.propagate(mesh.satrec, date) as PositionAndVelocity | boolean;
                            if (typeof positionAndVelocity === 'object' && positionAndVelocity && positionAndVelocity.position) {
                                const positionEci = positionAndVelocity.position;
                                const gmst = satellite.gstime(date);
                                const geodetic = satellite.eciToGeodetic(positionEci, gmst);
                                const latitude = satellite.degreesLat(geodetic.latitude);
                                const longitude = satellite.degreesLong(geodetic.longitude);

                                if (!isNaN(latitude) && !isNaN(longitude)) {
                                    const phi = (90 - latitude) * Math.PI / 180;
                                    const theta = -longitude * Math.PI / 180;
                                    const radius = 5.2;
                                    const x = radius * Math.sin(phi) * Math.cos(theta);
                                    const y = radius * Math.cos(phi);
                                    const z = radius * Math.sin(phi) * Math.sin(theta);
                                    mesh.position.set(x, y, z);
                                    if (mesh.glowMesh) mesh.glowMesh.position.set(x, y, z);
                                }
                            }
                        }
                    });
                }, 1000);

                return () => clearInterval(interval);
            })
            .catch(error => console.error('Errore fetch GeoJSON:', error));

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

    return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default GlobeComponent;