import React from 'react';
import './Header.css';

const Header: React.FC = () => {
    return (
        <header className="app-header">
            <div className="header-content">
                <h1 className="main-title">STARMONITOR</h1>
                <span className="subtitle">Starlink Tracker by Asyntes</span>
            </div>
        </header>
    );
};

export default Header;