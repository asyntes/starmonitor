'use client';

import React, { useState, useEffect } from 'react';
import './OrientationWarning.css';

const OrientationWarning: React.FC = () => {
    const [shouldShowWarning, setShouldShowWarning] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const isLandscape = width > height;
            
            const isTablet = ('ontouchstart' in window) && 
                           (Math.min(width, height) >= 768 || 
                            (Math.max(width, height) >= 1024 && Math.min(width, height) >= 600));
            
            const isPhone = ('ontouchstart' in window) && !isTablet;


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