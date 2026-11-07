import React from 'react';
import './SatelliteCounter.css';

interface SatelliteCounterProps {
    count: number;
    isLoading: boolean;
    hasError: boolean;
}

const SatelliteCounter: React.FC<SatelliteCounterProps> = ({ count, isLoading, hasError }) => {
    const statusClass = isLoading
        ? 'status-loading'
        : hasError
            ? 'status-error'
            : 'status-live';
    const statusLabel = isLoading
        ? 'Loading...'
        : hasError
            ? 'Unavailable'
            : 'Live';

    return (
        <div className="satellite-counter">
            <span className="counter-label">Starlink Satellites</span>
            <span className="counter-value">{count.toLocaleString()}</span>
            <span className={`counter-status ${statusClass}`}>
                {statusLabel}
            </span>
            {hasError && !isLoading && (
                <span className="counter-error">Orbital data temporarily unavailable</span>
            )}
            <span className="counter-source">via CelesTrak API</span>
        </div>
    );
};

export default SatelliteCounter;
