import * as THREE from 'three';

const earthMap = '/earth_atmos_2048.jpg';
const earthNormal = '/earth_normal_2048.jpg';

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

        const starPositions: { x: number; y: number }[] = [];
        const MIN_DISTANCE = 8; // Minimum distance between stars

        const isValidPosition = (x: number, y: number): boolean => {
            return starPositions.every(pos => {
                const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
                return distance >= MIN_DISTANCE;
            });
        };

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
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

interface Comet {
    head: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
}

const comets: Comet[] = [];

export const createComet = (scene: THREE.Scene): Comet => {
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const headMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4 + Math.random() * 0.3
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);

    const phi = Math.random() * Math.PI * 2;
    const theta = Math.acos(2 * Math.random() - 1);
    const distance = 180 + Math.random() * 120;

    const startPos = new THREE.Vector3(
        distance * Math.sin(theta) * Math.cos(phi),
        distance * Math.cos(theta),
        distance * Math.sin(theta) * Math.sin(phi)
    );

    head.position.copy(startPos);

    const velocityPhi = Math.random() * Math.PI * 2;
    const velocityTheta = Math.acos(2 * Math.random() - 1);
    const speed = 2.5 + Math.random() * 2.5;

    let velocity = new THREE.Vector3(
        speed * Math.sin(velocityTheta) * Math.cos(velocityPhi),
        speed * Math.cos(velocityTheta),
        speed * Math.sin(velocityTheta) * Math.sin(velocityPhi)
    );

    const centerDirection = startPos.clone().normalize().negate();
    const dotProduct = velocity.dot(centerDirection);

    const safetyRadius = 50;
    const angleToCenter = Math.acos(Math.abs(dotProduct / velocity.length()));
    const closestDistance = startPos.length() * Math.sin(angleToCenter);

    if (dotProduct > 0 || closestDistance < safetyRadius) {
        const awayDirection = startPos.clone().normalize();
        const perpendicular = new THREE.Vector3()
            .crossVectors(awayDirection, velocity)
            .normalize();
        const tangential = new THREE.Vector3()
            .crossVectors(perpendicular, awayDirection)
            .normalize();

        const outwardWeight = 0.3 + Math.random() * 0.4;
        velocity = awayDirection.multiplyScalar(outwardWeight)
            .add(tangential.multiplyScalar(1 - outwardWeight))
            .normalize()
            .multiplyScalar(speed);
    }

    scene.add(head);

    const maxLife = 80 + Math.random() * 60;

    return {
        head,
        velocity,
        life: maxLife,
        maxLife
    };
};

export const updateComets = (scene: THREE.Scene, deltaTime: number) => {
    if (Math.random() < 0.02) {
        const newComet = createComet(scene);
        comets.push(newComet);
    }

    for (let i = comets.length - 1; i >= 0; i--) {
        const comet = comets[i];

        comet.head.position.add(comet.velocity.clone().multiplyScalar(deltaTime));

        comet.life -= deltaTime;
        const fadeRatio = comet.life / comet.maxLife;

        (comet.head.material as THREE.MeshBasicMaterial).opacity = fadeRatio;

        if (comet.life <= 0 || comet.head.position.distanceTo(new THREE.Vector3(0, 0, 0)) > 350) {
            scene.remove(comet.head);
            comet.head.geometry.dispose();
            (comet.head.material as THREE.Material).dispose();
            comets.splice(i, 1);
        }
    }
};