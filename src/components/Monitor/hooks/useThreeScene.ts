import { useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createCleanSpaceSkybox, setupLighting, createEarth, updateComets } from '../utils/earthUtils';
import { loadGeographicData, drawGeographicBorders } from '../utils/geoUtils';
import { fetchTLEData, createSatellitePoints, getSatellitePosition } from '../utils/satelliteUtils';

export const useThreeScene = (
    mountRef: React.RefObject<HTMLDivElement | null>,
    setSatelliteCount: (count: number) => void,
    setIsLoading: (loading: boolean) => void
) => {
    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 7;
        controls.maxDistance = 20;
        controls.enablePan = false;

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        currentMount.appendChild(renderer.domElement);

        createCleanSpaceSkybox(scene);
        setupLighting(scene);
        createEarth(scene);

        const initialBackwardRotation = -0.62;
        scene.rotation.y = initialBackwardRotation;

        const isMobileViewport = () => {
            const aspectRatio = window.innerWidth / window.innerHeight;
            return window.innerWidth <= 768 || (window.innerWidth <= 1024 && aspectRatio < 1.2);
        };

        const setupCameraAndScene = () => {
            if (isMobileViewport()) {
                scene.position.y = 2.7;
                camera.position.z = 15;
                camera.position.y = 2;
                controls.minDistance = 5;
            } else {
                scene.position.y = 0;
                camera.position.z = 10;
                camera.position.y = 2;
                controls.minDistance = 3;
            }
            controls.update();
        };

        setupCameraAndScene();

        let isAutoRotating = true;
        let isUserInteracting = false;
        let lastInteractionTime = Date.now();
        const INACTIVITY_TIMEOUT = 7000;

        loadGeographicData().then((geoData) => {
            drawGeographicBorders(scene, geoData);

            fetchTLEData()
                .then(tleData => {
                    const { positions, satrecs, geometry } = createSatellitePoints(scene, tleData);

                    setSatelliteCount(satrecs.length);
                    setIsLoading(false);

                    const intervalId = setInterval(() => {
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

                    cleanupFunctions.push(() => clearInterval(intervalId));
                })
                .catch(error => {
                    console.error('Errore fetch TLE:', error);
                    setIsLoading(false);
                });
        });

        controls.addEventListener('start', () => {
            isUserInteracting = true;
            isAutoRotating = false;
            lastInteractionTime = Date.now();
        });

        controls.addEventListener('end', () => {
            isUserInteracting = false;
            lastInteractionTime = Date.now();
        });

        let animationFrameId: number;
        const cleanupFunctions: (() => void)[] = [];
        let lastTime = 0;

        const animate = (time: number) => {
            animationFrameId = requestAnimationFrame(animate);

            const deltaTime = time - lastTime;
            lastTime = time;

            if (!isAutoRotating && !isUserInteracting) {
                const timeSinceLastInteraction = Date.now() - lastInteractionTime;
                if (timeSinceLastInteraction > INACTIVITY_TIMEOUT) {
                    isAutoRotating = true;
                }
            }

            if (isAutoRotating && !isUserInteracting) {
                scene.rotation.y += 0.001;
            }

            // Update comets
            updateComets(scene, deltaTime * 0.016); // Convert to roughly 60fps timing

            controls.update();
            renderer.render(scene, camera);
        };
        animate(0);

        const handleResize = () => {
            setTimeout(() => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

                if (!isUserInteracting) {
                    setupCameraAndScene();
                }
            }, 100);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            if (currentMount && renderer.domElement) {
                currentMount.removeChild(renderer.domElement);
            }
            cancelAnimationFrame(animationFrameId);
            controls.dispose();
            renderer.dispose();
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }, [mountRef, setSatelliteCount, setIsLoading]);
};