import * as THREE from 'three';

interface UFOInstance {
    group: THREE.Group;
    velocity: THREE.Vector3;
    targetPosition: THREE.Vector3;
    bobOffset: number;
    lastSpawn: number;
    fadingOut: boolean;
    fadeStartTime: number;
    fadingIn: boolean;
    fadeInStartTime: number;
}

let ufoInstance: UFOInstance | null = null;

export const createUFO = (): THREE.Group => {
    const ufoGroup = new THREE.Group();

    const saucerGeometry = new THREE.SphereGeometry(0.15, 16, 8);
    saucerGeometry.scale(1, 0.3, 1);
    const saucerMaterial = new THREE.MeshPhongMaterial({
        color: 0x888888,
        shininess: 100,
        transparent: true,
        opacity: 1.0
    });
    (saucerMaterial as any).originalOpacity = 1.0;
    const saucer = new THREE.Mesh(saucerGeometry, saucerMaterial);

    const domeGeometry = new THREE.SphereGeometry(0.08, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMaterial = new THREE.MeshPhongMaterial({
        color: 0x444466,
        transparent: true,
        opacity: 1.0,
        shininess: 200
    });
    (domeMaterial as any).originalOpacity = 1.0;
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = 0.03;

    const lightGeometry = new THREE.SphereGeometry(0.02, 8, 6);
    const lightMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 1.0
    });
    (lightMaterial as any).originalOpacity = 1.0;

    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const light = new THREE.Mesh(lightGeometry, lightMaterial.clone());
        (light.material as any).originalOpacity = 1.0;
        light.position.x = Math.cos(angle) * 0.12;
        light.position.z = Math.sin(angle) * 0.12;
        light.position.y = -0.03;
        ufoGroup.add(light);
    }


    ufoGroup.add(saucer);
    ufoGroup.add(dome);

    return ufoGroup;
};

export const shouldSpawnUFO = (): boolean => {
    const now = Date.now();

    if (ufoInstance && now - ufoInstance.lastSpawn > 60000) {
        return false;
    }

    if (!ufoInstance && Math.random() < 0.01) {
        return true;
    }

    return false;
};

export const getRandomSpawnPosition = (): THREE.Vector3 => {
    const angle = Math.random() * Math.PI * 2;
    const height = 6 + Math.random() * 6;
    const x = Math.cos(angle) * height;
    const z = Math.sin(angle) * height;
    const y = (Math.random() - 0.5) * 3;

    const position = new THREE.Vector3(x, y, z);
    if (position.length() < 5.5) {
        position.normalize().multiplyScalar(5.5);
    }

    return position;
};

export const getRandomTargetPosition = (currentPos: THREE.Vector3): THREE.Vector3 => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 6 + Math.random() * 6;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = currentPos.y + (Math.random() - 0.5) * 2;

    const position = new THREE.Vector3(x, y, z);
    if (position.length() < 5.5) {
        position.normalize().multiplyScalar(5.5);
    }

    return position;
};

export const updateUFO = (scene: THREE.Scene, deltaTime: number): void => {
    const now = Date.now();

    if (shouldSpawnUFO() && !ufoInstance) {
        const ufoGroup = createUFO();
        const spawnPos = getRandomSpawnPosition();
        ufoGroup.position.copy(spawnPos);

        ufoGroup.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.material) {
                const material = child.material as THREE.Material & { opacity?: number };
                if (material.opacity !== undefined) {
                    material.opacity = 0;
                }
            }
        });

        ufoInstance = {
            group: ufoGroup,
            velocity: new THREE.Vector3(0, 0, 0),
            targetPosition: getRandomTargetPosition(spawnPos),
            bobOffset: Math.random() * Math.PI * 2,
            lastSpawn: now,
            fadingOut: false,
            fadeStartTime: 0,
            fadingIn: true,
            fadeInStartTime: now
        };

        scene.add(ufoGroup);
    }

    if (ufoInstance) {
        const ufo = ufoInstance;

        if (ufo.fadingIn) {
            const fadeElapsed = now - ufo.fadeInStartTime;
            const fadeDuration = 2000;
            const fadeProgress = Math.min(fadeElapsed / fadeDuration, 1);
            
            ufo.group.children.forEach(child => {
                if (child instanceof THREE.Mesh && child.material) {
                    const material = child.material as THREE.Material & { opacity?: number };
                    if (material.opacity !== undefined) {
                        const originalOpacity = (child.material as any).originalOpacity || 1;
                        material.opacity = fadeProgress * originalOpacity;
                    }
                }
            });

            if (fadeProgress >= 1) {
                ufo.fadingIn = false;
            }
        }

        if (now - ufo.lastSpawn > 60000 && !ufo.fadingOut && !ufo.fadingIn) {
            ufo.fadingOut = true;
            ufo.fadeStartTime = now;
        }

        if (ufo.fadingOut) {
            const fadeElapsed = now - ufo.fadeStartTime;
            const fadeDuration = 2000;
            const fadeProgress = Math.min(fadeElapsed / fadeDuration, 1);
            const opacity = 1 - fadeProgress;

            ufo.group.children.forEach(child => {
                if (child instanceof THREE.Mesh && child.material) {
                    const material = child.material as THREE.Material & { opacity?: number };
                    if (material.opacity !== undefined) {
                        const originalOpacity = (child.material as any).originalOpacity || 1;
                        material.opacity = opacity * originalOpacity;
                    }
                }
            });

            if (fadeProgress >= 1) {
                scene.remove(ufo.group);
                ufoInstance = null;
                return;
            }
        }

        const direction = new THREE.Vector3()
            .subVectors(ufo.targetPosition, ufo.group.position)
            .normalize();

        const speed = 0.02;
        ufo.velocity.lerp(direction.multiplyScalar(speed), 0.1);
        ufo.group.position.add(ufo.velocity);

        if (ufo.group.position.length() < 5.5) {
            ufo.group.position.normalize().multiplyScalar(5.5);
            ufo.targetPosition = getRandomTargetPosition(ufo.group.position);
        }

        ufo.bobOffset += deltaTime * 2;
        const bobAmount = Math.sin(ufo.bobOffset) * 0.01;
        ufo.group.position.y += bobAmount;

        ufo.group.rotation.y += deltaTime * 0.5;

        if (ufo.group.position.distanceTo(ufo.targetPosition) < 0.5) {
            ufo.targetPosition = getRandomTargetPosition(ufo.group.position);
        }

        if (!ufo.fadingOut && !ufo.fadingIn) {
            const lights = ufo.group.children.filter(child =>
                child instanceof THREE.Mesh &&
                (child.material as THREE.MeshBasicMaterial).color.getHex() === 0x00ff88
            );

            lights.forEach((light, index) => {
                const material = (light as THREE.Mesh).material as THREE.MeshBasicMaterial;
                const originalOpacity = (material as any).originalOpacity || 1.0;
                material.opacity = originalOpacity * (0.5 + Math.sin(now * 0.01 + index) * 0.3);
            });
        }
    }
};