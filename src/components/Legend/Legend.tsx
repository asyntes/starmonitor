import React from 'react';
import './Legend.css';

const Legend: React.FC = () => {
    return (
        <div className="service-legend">
            <div className="legend-title">Service Status</div>
            <div className="legend-items">
                <div className="legend-item">
                    <div className="legend-color available"></div>
                    <span className="legend-label">Available</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color waiting-list"></div>
                    <span className="legend-label">Waiting List</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color coming-soon"></div>
                    <span className="legend-label">Coming Soon</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color unavailable"></div>
                    <span className="legend-label">Unavailable</span>
                </div>
            </div>
        </div>
    );
};

export default Legend;