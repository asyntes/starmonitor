import React from 'react';
import './SatelliteCounter.css';

interface SatelliteCounterProps {
    count: number;
    isLoading: boolean;
}

const SatelliteCounter: React.FC<SatelliteCounterProps> = ({ count, isLoading }) => {
    return (
        <div className="satellite-counter">
            <span className="counter-label">Starlink Satellites</span>
            <span className="counter-value">{count.toLocaleString()}</span>
            <span className={`counter-status ${isLoading ? 'status-loading' : 'status-live'}`}>
                {isLoading ? 'Loading...' : 'Live'}
            </span>
        </div>
    );
};

export default SatelliteCounter;