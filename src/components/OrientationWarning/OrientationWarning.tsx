import React, { useState, useEffect } from 'react';
import './OrientationWarning.css';

const OrientationWarning: React.FC = () => {
    const [isLandscape, setIsLandscape] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            const isCurrentlyLandscape = window.innerWidth > window.innerHeight;
            const isCurrentlyMobile = window.innerWidth <= 768;

            setIsLandscape(isCurrentlyLandscape);
            setIsMobile(isCurrentlyMobile);
        };

        checkOrientation();

        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', () => {
            // Piccolo delay per assicurarsi che le dimensioni siano aggiornate
            setTimeout(checkOrientation, 100);
        });

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    if (!isMobile || !isLandscape) {
        return null;
    }

    return (
        <div className="orientation-warning">
            <div className="orientation-content">
                <div className="orientation-icon">
                    <div className="phone-icon"></div>
                </div>

                <h2 className="orientation-title">Rotate Device</h2>

                <p className="orientation-message">
                    For a better StarMonitor experience,
                    please rotate your phone to portrait mode.
                </p>

                <p className="orientation-subtitle">
                    Starlink Tracker by Asyntes
                </p>
            </div>
        </div>
    );
};

export default OrientationWarning;