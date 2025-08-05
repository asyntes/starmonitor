import React, { useRef, useEffect } from 'react';
import { useThreeScene } from './hooks/useThreeScene';
import { useSatelliteData } from './hooks/useSatelliteData';
import SatelliteCounter from '../SatelliteCounter/SatelliteCounter';
import Legend from '../Legend/Legend';

interface MonitorProps {
    onLoadingStateChange: (isLoading: boolean) => void;
}

const Monitor: React.FC<MonitorProps> = ({ onLoadingStateChange }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const { satelliteCount, isLoading, setSatelliteCount, setIsLoading } = useSatelliteData();

    useThreeScene(mountRef, setSatelliteCount, setIsLoading);

    // Sincronizza lo stato di loading con il componente App
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