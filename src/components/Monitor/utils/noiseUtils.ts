import * as THREE from 'three';

export interface NoiseConfig {
    intensity: number;
    speed: number;
    enabled: boolean;
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
        
        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            
            if (enabled) {
                vec2 uv = vUv;
                float grain = filmGrain(uv, time, intensity * 40.0);
                
                float redGrain = colorNoise(uv + time * 0.1) * intensity * 0.3;
                float greenGrain = colorNoise(uv + time * 0.2) * intensity * 0.3;
                float blueGrain = colorNoise(uv + time * 0.15) * intensity * 0.3;
                
                color.rgb += vec3(grain);
                color.r += redGrain;
                color.g += greenGrain;
                color.b += blueGrain;
                
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
            enabled: { value: true }
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
    
    setSize(width: number, height: number) {
        this.renderTarget.setSize(width, height);
    }
    
    dispose() {
        this.material.dispose();
        this.quad.geometry.dispose();
        this.renderTarget.dispose();
    }
}