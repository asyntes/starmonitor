import * as THREE from 'three';
import earthMap from '../../../assets/earth_atmos_2048.jpg?url';  // Up to src/, then into assets/
import earthNormal from '../../../assets/earth_normal_2048.jpg?url';

export const createCleanSpaceSkybox = (scene: THREE.Scene) => {
    const skyboxGeometry = new THREE.SphereGeometry(1000, 60, 40);

    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 2048, 1024);

        ctx.fillStyle = '#ffffff';

        // Array to store star positions for distance checking
        const starPositions: { x: number; y: number }[] = [];
        const MIN_DISTANCE = 8; // Minimum distance between stars

        const isValidPosition = (x: number, y: number): boolean => {
            return starPositions.every(pos => {
                const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
                return distance >= MIN_DISTANCE;
            });
        };

        // Main stars - reduced from 4000 to 1200
        for (let i = 0; i < 1200; i++) {
            let x: number, y: number;
            let attempts = 0;
            
            do {
                x = Math.floor(Math.random() * 2048);
                y = Math.floor(Math.random() * 1024);
                attempts++;
            } while (!isValidPosition(x, y) && attempts < 10);

            if (attempts < 10) {
                starPositions.push({ x, y });
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
        }

        // Background dimmer stars - reduced from 2000 to 600
        for (let i = 0; i < 600; i++) {
            let x: number, y: number;
            let attempts = 0;
            
            do {
                x = Math.floor(Math.random() * 2048);
                y = Math.floor(Math.random() * 1024);
                attempts++;
            } while (!isValidPosition(x, y) && attempts < 5);

            if (attempts < 5) {
                starPositions.push({ x, y });
                ctx.globalAlpha = Math.random() * 0.05 + 0.01;
                ctx.fillRect(x, y, 1, 1);
            }
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
};

export const setupLighting = (scene: THREE.Scene) => {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
};

export const createEarth = (scene: THREE.Scene) => {
    const loader = new THREE.TextureLoader();

    loader.load(
        earthMap,
        (texture) => {
            loader.load(
                earthNormal,
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
};