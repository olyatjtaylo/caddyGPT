
import React from 'react';
import './NavBar.css';

const NavBar = ({ switchView }) => (
    <nav className="nav-bar">
        <h1>Sweetens Cove</h1>
        <div className="nav-buttons">
            <button onClick={() => switchView('profile')} className="nav-btn">My Clubs</button>
            <button onClick={() => switchView('course')} className="nav-btn primary">Course</button>
        </div>
    </nav>
);

export default NavBar;
