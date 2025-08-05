import React, { useState, useEffect } from 'react';
import './OrientationWarning.css';

const OrientationWarning: React.FC = () => {
    const [shouldShowWarning, setShouldShowWarning] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            const isLandscape = window.innerWidth > window.innerHeight;
            const isMobile = window.innerWidth <= 768 ||
                (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) ||
                ('ontouchstart' in window);

            console.log('Orientation check:', {
                isLandscape,
                isMobile,
                width: window.innerWidth,
                height: window.innerHeight
            });

            setShouldShowWarning(isMobile && isLandscape);
        };

        checkOrientation();

        const handleOrientationChange = () => {
            setTimeout(checkOrientation, 100);
        };

        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', handleOrientationChange);

        if (screen && screen.orientation) {
            screen.orientation.addEventListener('change', handleOrientationChange);
        }

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                checkOrientation();
            }
        });

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', handleOrientationChange);
            if (screen && screen.orientation) {
                screen.orientation.removeEventListener('change', handleOrientationChange);
            }
            document.removeEventListener('visibilitychange', checkOrientation);
        };
    }, []);

    return (
        <div
            className="orientation-warning"
            style={{ display: shouldShowWarning ? 'flex' : 'none' }}
        >
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