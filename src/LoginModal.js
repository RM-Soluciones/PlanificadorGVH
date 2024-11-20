// LoginModal.js
import React, { useState } from 'react';
import './LoginModal.css';

function LoginModal({ onLogin, onClose }) {
    const [key, setKey] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        const correctKey = process.env.REACT_APP_SECRET_KEY;

        if (key === correctKey) {
            onLogin();
        } else {
            setError('Clave incorrecta. Inténtalo de nuevo.');
            setKey('');
        }
    };

    return (
        <div className="login-modal-overlay">
            <div className="login-modal">
                <button className="close-button" onClick={onClose}>X</button>
                <form onSubmit={handleLogin}>
                    <h2>Inicio de Sesión</h2>
                    <input
                        type="password"
                        placeholder="Ingresa la clave"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                    />
                    <button type="submit">Ingresar</button>
                    {error && <p className="error-message">{error}</p>}
                </form>
            </div>
        </div>
    );
}

export default LoginModal;
