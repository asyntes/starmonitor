import { useState } from 'react';

export const useSatelliteData = () => {
    const [satelliteCount, setSatelliteCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [hasError, setHasError] = useState<boolean>(false);

    return {
        satelliteCount,
        isLoading,
        hasError,
        setSatelliteCount,
        setIsLoading,
        setHasError,
    };
};