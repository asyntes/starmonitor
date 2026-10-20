import * as THREE from 'three';

type UFOPhase = 'approaching' | 'tilting' | 'abducting' | 'leaving';

interface UFOInstance {
    group: THREE.Group;
    velocity: THREE.Vector3;
    targetPosition: THREE.Vector3;
    bobOffset: number;
    bobApplied: number;
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

// Earth mesh radius is 5. Positions inside this shell are pushed back out,
// so a hover target has to sit outside it or the craft never arrives.
const MIN_CLEARANCE_RADIUS = 5.5;
const EARTH_APPROACH_RADIUS = 6.05;
const ARRIVAL_DISTANCE = 0.3;
// 0.02 units/frame at 60fps. Scaled by time below so 120/144Hz match.
const CRUISE_SPEED = 1.2;
const SPIN_SPEED = 8;
// Offset, not an accumulated per-frame nudge: ~0.01 units over 5 seconds.
const BOB_AMPLITUDE = 0.01;
const BOB_ANGULAR_SPEED = 1.25;

const deltaSeconds = (deltaTime: number): number => {
    // Caller passes frame milliseconds * 0.016. Clamp so a stalled frame
    // (or the first animation timestamp) cannot teleport the craft.
    if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
        return 0;
    }
    return Math.min(deltaTime / 16, 0.05);
};

const setBob = (ufo: UFOInstance, offset: number): void => {
    ufo.group.position.y += offset - ufo.bobApplied;
    ufo.bobApplied = offset;
};

const roamingBob = (ufo: UFOInstance, now: number): void => {
    const offset = Math.sin(now * 0.001 * BOB_ANGULAR_SPEED + ufo.bobOffset) * BOB_AMPLITUDE;
    setBob(ufo, offset);
};

const pathCrossesClearance = (from: THREE.Vector3, to: THREE.Vector3): boolean => {
    const offset = new THREE.Vector3().subVectors(to, from);
    const length = offset.length();
    if (length < 1e-5) {
        return from.length() < MIN_CLEARANCE_RADIUS;
    }

    const direction = offset.multiplyScalar(1 / length);
    const along = from.dot(direction);
    const outside = from.lengthSq() - MIN_CLEARANCE_RADIUS * MIN_CLEARANCE_RADIUS;
    if (outside <= 0) {
        return true;
    }

    const discriminant = along * along - outside;
    if (discriminant < 0) {
        return false;
    }

    const entry = -along - Math.sqrt(discriminant);
    return entry > 0 && entry < length;
};

const cruiseToward = (ufo: UFOInstance, dt: number): number => {
    const position = ufo.group.position;
    const toTarget = new THREE.Vector3().subVectors(ufo.targetPosition, position);
    const distance = toTarget.length();
    if (distance < 1e-5 || dt <= 0) {
        return distance;
    }

    let desired = toTarget.multiplyScalar(1 / distance);

    if (pathCrossesClearance(position, ufo.targetPosition)) {
        const radial = position.clone().normalize();
        const inward = desired.dot(radial);
        const tangent = desired.clone().addScaledVector(radial, -inward);
        if (tangent.lengthSq() < 1e-8) {
            const axis = Math.abs(radial.y) < 0.9
                ? new THREE.Vector3(0, 1, 0)
                : new THREE.Vector3(1, 0, 0);
            tangent.crossVectors(radial, axis);
        }
        tangent.normalize();
        if (position.length() < MIN_CLEARANCE_RADIUS + 0.25) {
            tangent.addScaledVector(radial, 0.45).normalize();
        }
        desired = tangent;
    }

    const smoothing = 1 - Math.pow(0.9, dt * 60);
    ufo.velocity.lerp(desired.multiplyScalar(CRUISE_SPEED), smoothing);
    position.addScaledVector(ufo.velocity, dt);

    const radius = position.length();
    if (radius < MIN_CLEARANCE_RADIUS && radius > 1e-6) {
        position.multiplyScalar(MIN_CLEARANCE_RADIUS / radius);
        const outward = position.clone().normalize();
        const inwardSpeed = ufo.velocity.dot(outward);
        if (inwardSpeed < 0) {
            ufo.velocity.addScaledVector(outward, -inwardSpeed);
        }
    }

    return position.distanceTo(ufo.targetPosition);
};

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
    if (position.length() < MIN_CLEARANCE_RADIUS) {
        position.normalize().multiplyScalar(MIN_CLEARANCE_RADIUS);
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
    if (position.length() < MIN_CLEARANCE_RADIUS) {
        position.normalize().multiplyScalar(MIN_CLEARANCE_RADIUS);
    }

    return position;
};

export const getEarthProximityPosition = (from: THREE.Vector3): THREE.Vector3 => {
    const direction = from.clone();
    if (direction.lengthSq() < 1e-6) {
        direction.set(1, 0, 0);
    }
    direction.normalize();

    // Keep the hover point on the craft's side of Earth. A far-side target
    // sends the straight path through the clearance shell, and the shell
    // clamp used to pin the UFO there short of the arrival distance.
    const yaw = (Math.random() - 0.5) * 0.4;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const tilted = new THREE.Vector3(
        direction.x * cos - direction.z * sin,
        direction.y + (Math.random() - 0.5) * 0.1,
        direction.x * sin + direction.z * cos
    );
    if (tilted.lengthSq() < 1e-6) {
        tilted.copy(direction);
    }

    return tilted.normalize().multiplyScalar(EARTH_APPROACH_RADIUS);
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
            bobApplied: 0,
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

        // The 20s visit timer used to start fading during tilting or abduction
        // whenever the flight in ran long. Maneuvers always finish first.
        if (
            ufo.phase === 'leaving' &&
            now - ufo.lastSpawn > 20000 &&
            !ufo.fadingOut &&
            !ufo.fadingIn
        ) {
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
        const dt = deltaSeconds(deltaTime);

        switch (ufo.phase) {
            case 'approaching': {
                if (!ufo.hasVisitedEarth) {
                    ufo.targetPosition = getEarthProximityPosition(ufo.group.position);
                    ufo.hasVisitedEarth = true;
                }

                setBob(ufo, 0);
                const distance = cruiseToward(ufo, dt);

                if (distance < ARRIVAL_DISTANCE) {
                    ufo.phase = 'tilting';
                    ufo.phaseStartTime = now;
                    ufo.velocity.set(0, 0, 0);
                    ufo.originalRotation.copy(ufo.group.rotation);
                } else {
                    roamingBob(ufo, now);
                    ufo.group.rotation.y += dt * SPIN_SPEED;
                }

                const tractorBeam = ufo.group.children.find(child =>
                    child instanceof THREE.Mesh &&
                    child.geometry instanceof THREE.ConeGeometry
                );
                if (tractorBeam) {
                    tractorBeam.visible = false;
                }
                break;
            }

            case 'tilting': {
                setBob(ufo, 0);
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

                if (phaseElapsed > 2000) {
                    ufo.phase = 'abducting';
                    ufo.phaseStartTime = now;
                }
                break;
            }

            case 'abducting': {
                setBob(ufo, 0);
                const earthPosition = new THREE.Vector3(0, scene.position.y, 0);
                ufo.group.lookAt(earthPosition);
                ufo.group.rotateX(-Math.PI / 2);
                ufo.group.rotateY(phaseElapsed * 0.02);

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

                setBob(ufo, 0);
                const distance = cruiseToward(ufo, dt);
                if (distance < 0.5) {
                    ufo.targetPosition = getRandomTargetPosition(ufo.group.position);
                }
                roamingBob(ufo, now);
                ufo.group.rotation.y += dt * SPIN_SPEED;
                break;
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