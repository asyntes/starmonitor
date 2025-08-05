import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
    isLoading: boolean;
    onLoadingComplete?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading, onLoadingComplete }) => {
    const [shouldShow, setShouldShow] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        if (!isLoading && shouldShow && !fadeOut) {
            // Inizia il fade out
            setFadeOut(true);

            // Dopo l'animazione di fade out, nascondi completamente il componente
            const timer = setTimeout(() => {
                setShouldShow(false);
                if (onLoadingComplete) {
                    onLoadingComplete();
                }
            }, 800); // Durata dell'animazione fade-out

            return () => clearTimeout(timer);
        }
    }, [isLoading, shouldShow, fadeOut, onLoadingComplete]);

    // Fallback: dopo 20 secondi forza la chiusura del loading
    useEffect(() => {
        const fallbackTimer = setTimeout(() => {
            if (shouldShow && !fadeOut) {
                console.log('Loading screen timeout - forcing close');
                setFadeOut(true);
                setTimeout(() => {
                    setShouldShow(false);
                    if (onLoadingComplete) {
                        onLoadingComplete();
                    }
                }, 800);
            }
        }, 20000);

        return () => clearTimeout(fallbackTimer);
    }, [shouldShow, fadeOut, onLoadingComplete]);

    if (!shouldShow) {
        return null;
    }

    return (
        <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
            <div className="loading-content">
                <h1 className="loading-title">STARMONITOR</h1>
                <p className="loading-subtitle">Starlink Tracker by Asyntes</p>

                <div className="loading-spinner"></div>

                <div className="loading-status">
                    {isLoading ? 'Loading Satellites...' : 'Ready'}
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;