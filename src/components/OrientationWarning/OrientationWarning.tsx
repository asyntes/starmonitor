import React, { useState, useEffect } from 'react';
import './OrientationWarning.css';

const OrientationWarning: React.FC = () => {
    const [shouldShowWarning, setShouldShowWarning] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const isLandscape = width > height;
            const maxDimension = Math.max(width, height);
            const minDimension = Math.min(width, height);
            
            const isTablet = (maxDimension > 768 && maxDimension <= 1024) || 
                           (minDimension > 600 && maxDimension <= 1366);
            const isPhone = maxDimension <= 768 && !isTablet;

            console.log('Orientation check:', {
                isLandscape,
                isPhone,
                isTablet,
                width,
                height,
                maxDimension,
                minDimension
            });

            setShouldShowWarning(isPhone && isLandscape);
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
                    Please rotate your device.
                </p>

                <p className="orientation-subtitle">
                    Starlink Tracker by Asyntes
                </p>
            </div>
        </div>
    );
};

export default OrientationWarning;