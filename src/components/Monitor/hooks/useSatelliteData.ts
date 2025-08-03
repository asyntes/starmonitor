import { useState } from 'react';

export const useSatelliteData = () => {
    const [satelliteCount, setSatelliteCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    return {
        satelliteCount,
        isLoading,
        setSatelliteCount,
        setIsLoading
    };
};