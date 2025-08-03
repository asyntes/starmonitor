import React from 'react';
import Monitor from './components/Monitor/Monitor';
import Header from './components/Header/Header';

const App: React.FC = () => {
  return (
    <div className="App">
      <Header />
      <Monitor />
    </div>
  );
};

export default App;