import React from 'react';
import './Legend.css';

const Legend: React.FC = () => {
    return (
        <div className="service-legend">
            <div className="legend-title">Service Status</div>
            <div className="legend-items">
                <div className="legend-item">
                    <div className="legend-color active"></div>
                    <span className="legend-label">Available</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color restricted"></div>
                    <span className="legend-label">Restricted</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color banned"></div>
                    <span className="legend-label">Unavailable</span>
                </div>
            </div>
        </div>
    );
};

export default Legend;