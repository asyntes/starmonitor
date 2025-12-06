'use client';

import { useState } from 'react';
import Monitor from '../src/components/Monitor/Monitor';
import Header from '../src/components/Header/Header';
import LoadingScreen from '../src/components/LoadingScreen/LoadingScreen';
import OrientationWarning from '../src/components/OrientationWarning/OrientationWarning';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  const handleLoadingComplete = () => {
    setShowLoadingScreen(false);
  };

  return (
    <div className="App">
      <OrientationWarning />

      {showLoadingScreen && (
        <LoadingScreen
          isLoading={isLoading}
          onLoadingComplete={handleLoadingComplete}
        />
      )}
      <Header />
      <Monitor
        onLoadingStateChange={setIsLoading}
      />
    </div>
  );
}
