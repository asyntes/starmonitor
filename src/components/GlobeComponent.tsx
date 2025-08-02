import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const GlobeComponent: React.FC = () => {
    const mountRef = useRef<HTMLDivElement | null>(null);

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

        // Carica texture principale e normal map per rilievi (senza flip, come prima)
        loader.load(
            'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg', // Texture confermata
            (texture) => {
                loader.load(
                    'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg', // Normal map
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
                            const theta = -lon * Math.PI / 180; // Invertito per specchiare i contorni e allineare
                            const radius = 5.01;
                            const x = radius * Math.sin(phi) * Math.cos(theta);
                            const y = radius * Math.cos(phi);
                            const z = radius * Math.sin(phi) * Math.sin(theta);
                            return new THREE.Vector3(x, y, z);
                        });

                        points.push(points[0]);

                        const geometry = new THREE.BufferGeometry().setFromPoints(points);
                        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff }); // Bianco per contrasto
                        const borderLine = new THREE.Line(geometry, lineMaterial);
                        scene.add(borderLine);
                    });
                });
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

        // Funzione di animazione
        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            scene.rotation.y += 0.001; // Rotazione automatica attiva
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