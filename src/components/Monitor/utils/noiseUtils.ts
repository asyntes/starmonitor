import * as THREE from 'three';

export interface NoiseConfig {
    intensity: number;
    speed: number;
    enabled: boolean;
    interferenceIntensity: number;
    interferenceFrequency: number;
}

export const createNoiseShader = () => {
    const vertexShader = `
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float intensity;
        uniform bool enabled;
        uniform float interferenceIntensity;
        uniform float interferenceFrequency;
        varying vec2 vUv;
        
        float random(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        float filmGrain(vec2 uv, float frame, float multiplier) {
            float x = (uv.x + 4.0) * (uv.y + 4.0) * (frame * 10.0);
            return (mod((mod(x, 13.0) + 1.0) * (mod(x, 123.0) + 1.0), 0.01) - 0.005) * multiplier;
        }
        
        float colorNoise(vec2 uv) {
            return random(uv) * 2.0 - 1.0;
        }
        
        float horizontalInterference(vec2 uv, float time, float frequency, float intensity) {
            float interferenceTime = time * frequency;
            float interferencePhase = fract(interferenceTime);
            
            float linePosition = mix(-0.05, 1.05, interferencePhase);
            float lineWidth = 0.006 + sin(interferenceTime * 2.0) * 0.002;
            
            float distanceToLine = abs(uv.y - linePosition);
            float lineFade = 1.0 - smoothstep(0.0, lineWidth, distanceToLine);
            
            float flickerNoise = sin(interferenceTime * 100.0) * 0.3 + sin(interferenceTime * 250.0) * 0.2;
            float horizontalNoise = sin(uv.x * 200.0 + interferenceTime * 50.0) * 0.1;
            
            float finalIntensity = intensity * lineFade * (0.7 + flickerNoise + horizontalNoise);
            
            return finalIntensity;
        }
        
        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            
            if (enabled) {
                vec2 uv = vUv;
                float grain = filmGrain(uv, time, intensity * 40.0);
                
                float redGrain = colorNoise(uv + time * 0.1) * intensity * 0.3;
                float greenGrain = colorNoise(uv + time * 0.2) * intensity * 0.3;
                float blueGrain = colorNoise(uv + time * 0.15) * intensity * 0.3;
                
                float interference = horizontalInterference(uv, time, interferenceFrequency, interferenceIntensity);
                
                color.rgb += vec3(grain);
                color.r += redGrain;
                color.g += greenGrain;
                color.b += blueGrain;
                
                color.rgb += vec3(interference * 0.04);
                
                color.rgb *= 2.5;
                
                color.rgb = clamp(color.rgb, 0.0, 1.0);
            }
            
            gl_FragColor = color;
        }
    `;

    return {
        uniforms: {
            tDiffuse: { value: null },
            time: { value: 0.0 },
            intensity: { value: 0.1 },
            enabled: { value: true },
            interferenceIntensity: { value: 0.2 },
            interferenceFrequency: { value: 0.1 }
        },
        vertexShader,
        fragmentShader
    };
};

export class NoisePass {
    private material: THREE.ShaderMaterial;
    private quad: THREE.Mesh;
    private camera: THREE.OrthographicCamera;
    private scene: THREE.Scene;
    private renderTarget: THREE.WebGLRenderTarget;

    constructor(width: number, height: number) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const shader = createNoiseShader();
        this.material = new THREE.ShaderMaterial({
            uniforms: shader.uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        this.quad = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.quad);

        this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        });
    }

    render(renderer: THREE.WebGLRenderer, inputTexture: THREE.Texture, outputTarget?: THREE.WebGLRenderTarget | null) {
        this.material.uniforms.tDiffuse.value = inputTexture;

        renderer.setRenderTarget(outputTarget || null);
        renderer.render(this.scene, this.camera);
    }

    updateTime(time: number) {
        this.material.uniforms.time.value = time;
    }

    setIntensity(intensity: number) {
        this.material.uniforms.intensity.value = intensity;
    }

    setEnabled(enabled: boolean) {
        this.material.uniforms.enabled.value = enabled;
    }

    setInterferenceIntensity(intensity: number) {
        this.material.uniforms.interferenceIntensity.value = intensity;
    }

    setInterferenceFrequency(frequency: number) {
        this.material.uniforms.interferenceFrequency.value = frequency;
    }

    setSize(width: number, height: number) {
        this.renderTarget.setSize(width, height);
    }

    dispose() {
        this.material.dispose();
        this.quad.geometry.dispose();
        this.renderTarget.dispose();
    }
}