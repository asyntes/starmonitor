import React, { useRef } from 'react';
import { useThreeScene } from './hooks/useThreeScene';
import { useSatelliteData } from './hooks/useSatelliteData';
import SatelliteCounter from '../SatelliteCounter/SatelliteCounter';

const Monitor: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const { satelliteCount, isLoading, setSatelliteCount, setIsLoading } = useSatelliteData();
    useThreeScene(mountRef, setSatelliteCount, setIsLoading);

    return (
        <>
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
            <SatelliteCounter count={satelliteCount} isLoading={isLoading} />
        </>
    );
};

export default Monitor;