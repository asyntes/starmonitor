import { useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createCleanSpaceSkybox, setupLighting, createEarth, updateComets } from '../utils/earthUtils';
import { loadGeographicData, drawGeographicBorders } from '../utils/geoUtils';
import { fetchTLEData, createSatellitePoints, getSatellitePosition } from '../utils/satelliteUtils';
import { updateUFO, forceUFODisappear, getUFOGroup } from '../utils/ufoUtils';
import { NoisePass } from '../utils/noiseUtils';

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

        const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        });

        const noisePass = new NoisePass(window.innerWidth, window.innerHeight);
        noisePass.setIntensity(0.15);
        noisePass.setEnabled(true);
        noisePass.setInterferenceIntensity(0.4);
        noisePass.setInterferenceFrequency(0.08);

        createCleanSpaceSkybox(scene);
        setupLighting(scene);
        createEarth(scene);

        const initialBackwardRotation = -0.62;
        scene.rotation.y = initialBackwardRotation;

        const getDeviceType = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const maxDimension = Math.max(width, height);
            const minDimension = Math.min(width, height);

            const isTablet = (maxDimension > 768 && maxDimension <= 1400) &&
                (minDimension > 600 && minDimension <= 1024);

            if (isTablet) {
                return 'tablet';
            } else if (minDimension <= 500) {
                return 'phone';
            } else {
                return 'desktop';
            }
        };

        const setupCameraAndScene = () => {
            const deviceType = getDeviceType();
            const aspectRatio = window.innerWidth / window.innerHeight;

            if (deviceType === 'phone') {
                if (aspectRatio < 0.55) {
                    scene.position.y = 2.5;
                    camera.position.z = 18;
                    camera.position.y = 0.5;
                } else {
                    scene.position.y = 2.7;
                    camera.position.z = 15;
                    camera.position.y = 2;
                }
                controls.minDistance = 8;
            } else if (deviceType === 'tablet') {
                if (aspectRatio < 1) {
                    scene.position.y = 1;
                    camera.position.z = 14;
                } else {
                    scene.position.y = 0;
                    camera.position.z = 12;
                }
                controls.minDistance = 6;
            } else {
                scene.position.y = 0;
                camera.position.z = 10;
                controls.minDistance = 6;
            }
            controls.update();
        };

        setupCameraAndScene();

        let isAutoRotating = true;
        let isUserInteracting = false;
        let lastInteractionTime = Date.now();
        const INACTIVITY_TIMEOUT = 7000;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const handleClick = (event: MouseEvent | TouchEvent) => {
            event.preventDefault();

            let clientX: number, clientY: number;

            if ('touches' in event) {
                if (event.touches.length === 0) return;
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
            } else {
                clientX = event.clientX;
                clientY = event.clientY;
            }

            mouse.x = (clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            const ufoGroup = getUFOGroup();
            if (ufoGroup) {
                const intersects = raycaster.intersectObjects(ufoGroup.children, true);
                if (intersects.length > 0) {
                    forceUFODisappear();
                }
            }
        };

        renderer.domElement.addEventListener('click', handleClick);
        renderer.domElement.addEventListener('touchstart', handleClick);

        loadGeographicData().then(async (geoData) => {
            await drawGeographicBorders(scene, geoData);

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

            updateComets(scene, deltaTime * 0.016);
            updateUFO(scene, deltaTime * 0.016);


            noisePass.updateTime(time * 0.001);

            controls.update();

            renderer.setRenderTarget(renderTarget);
            renderer.render(scene, camera);

            noisePass.render(renderer, renderTarget.texture, null);
        };
        animate(0);

        const handleResize = () => {
            setTimeout(() => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

                renderTarget.setSize(window.innerWidth, window.innerHeight);
                noisePass.setSize(window.innerWidth, window.innerHeight);

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
            renderer.domElement.removeEventListener('click', handleClick);
            renderer.domElement.removeEventListener('touchstart', handleClick);
            if (currentMount && renderer.domElement) {
                currentMount.removeChild(renderer.domElement);
            }
            cancelAnimationFrame(animationFrameId);
            controls.dispose();
            renderer.dispose();
            renderTarget.dispose();
            noisePass.dispose();
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }, [mountRef, setSatelliteCount, setIsLoading]);
};