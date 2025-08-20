import React, { useRef, useEffect } from 'react';
import { useThreeScene } from './hooks/useThreeScene';
import { useSatelliteData } from './hooks/useSatelliteData';
import type { NoiseConfig } from './utils/noiseUtils';
import SatelliteCounter from '../SatelliteCounter/SatelliteCounter';
import Legend from '../Legend/Legend';

interface MonitorProps {
    onLoadingStateChange: (isLoading: boolean) => void;
}

const Monitor: React.FC<MonitorProps> = ({ onLoadingStateChange }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const { satelliteCount, isLoading, setSatelliteCount, setIsLoading } = useSatelliteData();
    
    const grainConfig: NoiseConfig = {
        intensity: 0.15,
        speed: 1.0,
        enabled: true
    };

    useThreeScene(mountRef, setSatelliteCount, setIsLoading, grainConfig);

    useEffect(() => {
        onLoadingStateChange(isLoading);
    }, [isLoading, onLoadingStateChange]);

    return (
        <>
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
            <SatelliteCounter count={satelliteCount} isLoading={isLoading} />
            <Legend />
        </>
    );
};

export default Monitor;