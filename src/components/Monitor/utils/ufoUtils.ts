import * as THREE from 'three';

type UFOPhase = 'approaching' | 'tilting' | 'abducting' | 'leaving';

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
    phase: UFOPhase;
    phaseStartTime: number;
    originalRotation: THREE.Euler;
    spinDirection: number;
    hasVisitedEarth: boolean;
}

let ufoInstance: UFOInstance | null = null;

export const createUFO = (): THREE.Group => {
    const ufoGroup = new THREE.Group();

    const saucerGeometry = new THREE.SphereGeometry(0.25, 16, 8);
    saucerGeometry.scale(1, 0.3, 1);
    const saucerMaterial = new THREE.MeshPhongMaterial({
        color: 0xaaaaaa,
        shininess: 100,
        transparent: true,
        opacity: 1.0
    });
    (saucerMaterial as THREE.MeshPhongMaterial & { originalOpacity: number }).originalOpacity = 1.0;
    const saucer = new THREE.Mesh(saucerGeometry, saucerMaterial);

    const openingGeometry = new THREE.RingGeometry(0.06, 0.12, 16);
    const openingMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        shininess: 50,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide
    });
    (openingMaterial as THREE.MeshPhongMaterial & { originalOpacity: number }).originalOpacity = 1.0;
    const opening = new THREE.Mesh(openingGeometry, openingMaterial);
    opening.position.y = -0.075;
    opening.rotation.x = -Math.PI / 2;

    const tractorBeamGeometry = new THREE.ConeGeometry(0.3, 1.5, 8, 1, true);
    const tractorBeamMaterial = new THREE.MeshBasicMaterial({
        color: 0x66cdaa,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide
    });
    (tractorBeamMaterial as THREE.MeshBasicMaterial & { originalOpacity: number }).originalOpacity = 0.3;
    const tractorBeam = new THREE.Mesh(tractorBeamGeometry, tractorBeamMaterial);
    tractorBeam.position.y = -0.8;
    tractorBeam.rotation.x = 0;

    const domeGeometry = new THREE.SphereGeometry(0.13, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMaterial = new THREE.MeshPhongMaterial({
        color: 0x725097,
        transparent: true,
        opacity: 0.9,
        shininess: 200
    });
    (domeMaterial as THREE.MeshPhongMaterial & { originalOpacity: number }).originalOpacity = 0.9;
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = 0.05;

    const lightGeometry = new THREE.SphereGeometry(0.035, 8, 6);
    const lightMaterial = new THREE.MeshBasicMaterial({
        color: 0x87ceeb,
        transparent: true,
        opacity: 1.0
    });
    (lightMaterial as THREE.MeshBasicMaterial & { originalOpacity: number }).originalOpacity = 1.0;

    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const light = new THREE.Mesh(lightGeometry, lightMaterial.clone());
        (light.material as THREE.MeshBasicMaterial & { originalOpacity: number }).originalOpacity = 1.0;
        light.position.x = Math.cos(angle) * 0.20;
        light.position.z = Math.sin(angle) * 0.20;
        light.position.y = -0.05;
        ufoGroup.add(light);
    }


    ufoGroup.add(saucer);
    ufoGroup.add(dome);
    ufoGroup.add(opening);
    ufoGroup.add(tractorBeam);

    return ufoGroup;
};

export const shouldSpawnUFO = (): boolean => {
    const now = Date.now();

    if (ufoInstance && now - ufoInstance.lastSpawn > 60000) {
        return false;
    }

    if (!ufoInstance && Math.random() < 0.001) {
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

export const getEarthProximityPosition = (): THREE.Vector3 => {
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * 5.3;
    const z = Math.sin(angle) * 5.3;
    const y = (Math.random() - 0.5) * 1;
    
    return new THREE.Vector3(x, y, z);
};

export const forceUFODisappear = (): void => {
    if (ufoInstance && !ufoInstance.fadingOut) {
        ufoInstance.fadingOut = true;
        ufoInstance.fadeStartTime = Date.now();
    }
};

export const getUFOGroup = (): THREE.Group | null => {
    return ufoInstance ? ufoInstance.group : null;
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
            fadeInStartTime: now,
            phase: 'approaching',
            phaseStartTime: now,
            originalRotation: new THREE.Euler(0, 0, 0),
            spinDirection: Math.random() > 0.5 ? 1 : -1,
            hasVisitedEarth: false
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
                        const originalOpacity = (child.material as THREE.Material & { originalOpacity?: number }).originalOpacity || 1;
                        material.opacity = fadeProgress * originalOpacity;
                    }
                }
            });

            if (fadeProgress >= 1) {
                ufo.fadingIn = false;
            }
        }

        if (now - ufo.lastSpawn > 20000 && !ufo.fadingOut && !ufo.fadingIn) {
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
                        const originalOpacity = (child.material as THREE.Material & { originalOpacity?: number }).originalOpacity || 1;
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

        const phaseElapsed = now - ufo.phaseStartTime;
        
        switch (ufo.phase) {
            case 'approaching': {
                if (!ufo.hasVisitedEarth) {
                    ufo.targetPosition = getEarthProximityPosition();
                    ufo.hasVisitedEarth = true;
                }

                const direction = new THREE.Vector3()
                    .subVectors(ufo.targetPosition, ufo.group.position)
                    .normalize();

                const speed = 0.02;
                ufo.velocity.lerp(direction.multiplyScalar(speed), 0.1);
                ufo.group.position.add(ufo.velocity);

                if (ufo.group.position.distanceTo(ufo.targetPosition) < 0.3) {
                    ufo.phase = 'tilting';
                    ufo.phaseStartTime = now;
                    ufo.velocity.set(0, 0, 0);
                    ufo.originalRotation.copy(ufo.group.rotation);
                }

                const tractorBeam = ufo.group.children.find(child => 
                    child instanceof THREE.Mesh && 
                    child.geometry instanceof THREE.ConeGeometry
                );
                if (tractorBeam) {
                    tractorBeam.visible = false;
                }

                ufo.bobOffset += deltaTime * 2;
                const bobAmount = Math.sin(ufo.bobOffset) * 0.01;
                ufo.group.position.y += bobAmount;
                ufo.group.rotation.y += deltaTime * 0.5;
                break;
            }

            case 'tilting': {
                const tiltProgress = Math.min(phaseElapsed / 1500, 1);
                
                const earthPosition = new THREE.Vector3(0, scene.position.y, 0);
                ufo.group.lookAt(earthPosition);
                ufo.group.rotateX(THREE.MathUtils.lerp(0, -Math.PI / 2, tiltProgress));
                
                const tractorBeam = ufo.group.children.find(child => 
                    child instanceof THREE.Mesh && 
                    child.geometry instanceof THREE.ConeGeometry
                );
                if (tractorBeam) {
                    tractorBeam.visible = false;
                }
                
                ufo.bobOffset += deltaTime * 2;
                const bobAmount = Math.sin(ufo.bobOffset) * 0.015;
                ufo.group.position.y += bobAmount;

                if (phaseElapsed > 2000) {
                    ufo.phase = 'abducting';
                    ufo.phaseStartTime = now;
                }
                break;
            }

            case 'abducting': {
                const earthPosition = new THREE.Vector3(0, scene.position.y, 0);
                ufo.group.lookAt(earthPosition);
                ufo.group.rotateX(-Math.PI / 2);
                ufo.group.rotateY(phaseElapsed * 0.02);
                
                ufo.bobOffset += deltaTime * 3;
                const bobAmount = Math.sin(ufo.bobOffset) * 0.02;
                ufo.group.position.y += bobAmount;

                const tractorBeam = ufo.group.children.find(child => 
                    child instanceof THREE.Mesh && 
                    child.geometry instanceof THREE.ConeGeometry
                );
                if (tractorBeam) {
                    tractorBeam.visible = true;
                    const material = (tractorBeam as THREE.Mesh).material as THREE.MeshBasicMaterial;
                    const targetOpacity = (material as THREE.MeshBasicMaterial & { originalOpacity?: number }).originalOpacity || 0.3;
                    material.opacity = targetOpacity * (0.7 + Math.sin(now * 0.01) * 0.3);
                }

                if (phaseElapsed > 5000) {
                    ufo.phase = 'leaving';
                    ufo.phaseStartTime = now;
                    ufo.targetPosition = getRandomTargetPosition(ufo.group.position);
                }
                break;
            }

            case 'leaving': {
                const restoreProgress = Math.min(phaseElapsed / 2000, 1);
                
                const tractorBeam = ufo.group.children.find(child => 
                    child instanceof THREE.Mesh && 
                    child.geometry instanceof THREE.ConeGeometry
                );
                if (tractorBeam) {
                    tractorBeam.visible = false;
                }
                
                if (restoreProgress < 1) {
                    const earthPosition = new THREE.Vector3(0, scene.position.y, 0);
                    ufo.group.lookAt(earthPosition);
                    ufo.group.rotateX(THREE.MathUtils.lerp(-Math.PI / 2, 0, restoreProgress));
                } else {
                    ufo.group.rotation.x = 0;
                    ufo.group.rotation.z = 0;
                }

                const direction = new THREE.Vector3()
                    .subVectors(ufo.targetPosition, ufo.group.position)
                    .normalize();

                const speed = 0.02;
                ufo.velocity.lerp(direction.multiplyScalar(speed), 0.1);
                ufo.group.position.add(ufo.velocity);

                ufo.bobOffset += deltaTime * 2;
                const bobAmount = Math.sin(ufo.bobOffset) * 0.01;
                ufo.group.position.y += bobAmount;
                ufo.group.rotation.y += deltaTime * 0.5;

                if (ufo.group.position.distanceTo(ufo.targetPosition) < 0.5) {
                    ufo.targetPosition = getRandomTargetPosition(ufo.group.position);
                }
                break;
            }
        }

        if (ufo.group.position.length() < 5.5 && ufo.phase !== 'tilting' && ufo.phase !== 'abducting') {
            ufo.group.position.normalize().multiplyScalar(5.5);
            if (ufo.phase === 'leaving') {
                ufo.targetPosition = getRandomTargetPosition(ufo.group.position);
            }
        }

        if (!ufo.fadingOut && !ufo.fadingIn) {
            const lights = ufo.group.children.filter(child =>
                child instanceof THREE.Mesh &&
                (child.material as THREE.MeshBasicMaterial).color.getHex() === 0x87ceeb &&
                !(child.geometry instanceof THREE.ConeGeometry)
            );

            lights.forEach((light, index) => {
                const material = (light as THREE.Mesh).material as THREE.MeshBasicMaterial;
                const originalOpacity = (material as THREE.MeshBasicMaterial & { originalOpacity?: number }).originalOpacity || 1.0;
                material.opacity = originalOpacity * (0.5 + Math.sin(now * 0.01 + index) * 0.3);
            });
        }
    }
};