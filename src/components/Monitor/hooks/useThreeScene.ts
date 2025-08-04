import { useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createCleanSpaceSkybox, setupLighting, createEarth } from '../utils/earthUtils';
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

        renderer.setSize(window.innerWidth, window.innerHeight);
        currentMount.appendChild(renderer.domElement);

        createCleanSpaceSkybox(scene);
        setupLighting(scene);
        createEarth(scene);

        const initialBackwardRotation = -0.35;
        scene.rotation.y = initialBackwardRotation;

        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            scene.position.y = 2.2;
        }

        let isAutoRotating = true;

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

        if (window.innerWidth <= 768) {
            camera.position.z = 15;
            camera.position.y = 2;
        } else {
            camera.position.z = 10;
            camera.position.y = 2;
        }

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 7;
        controls.maxDistance = 20;
        controls.enablePan = false;

        controls.addEventListener('change', () => {
            isAutoRotating = false;
        });

        let animationFrameId: number;
        const cleanupFunctions: (() => void)[] = [];

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            if (isAutoRotating) {
                scene.rotation.y += 0.001;
            }
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;

            const newIsMobile = window.innerWidth <= 768;
            if (newIsMobile) {
                scene.position.y = 2.2;
                camera.position.z = 15;
                camera.position.y = 2;
            } else {
                scene.position.y = 0;
                camera.position.z = 10;
                camera.position.y = 2;
            }

            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
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