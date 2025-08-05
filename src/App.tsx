import React, { useState } from 'react';
import Monitor from './components/Monitor/Monitor';
import Header from './components/Header/Header';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import OrientationWarning from './components/OrientationWarning/OrientationWarning';

const App: React.FC = () => {
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
};

export default App;