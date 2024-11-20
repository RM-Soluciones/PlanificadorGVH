// Header.js
import React from 'react';
import './Header.css';

function Header({ isAuthenticated, onLogout, onLogin }) {
    return (
        <header className="app-header">
            <h1>Planificador se Servicios</h1>
            <div>
                {isAuthenticated ? (
                    <button className="auth-button" onClick={onLogout}>
                        Cerrar Sesión
                    </button>
                ) : (
                    <button className="auth-button" onClick={onLogin}>
                        Iniciar Sesión
                    </button>
                )}
            </div>
        </header>
    );
}

export default Header;
