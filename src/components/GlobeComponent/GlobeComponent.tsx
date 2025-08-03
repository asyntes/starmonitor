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

        const createCleanSpaceSkybox = () => {
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
            })
            .catch(error => {
                console.error('Errore fetch GeoJSON:', error);
                setIsLoading(false);
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