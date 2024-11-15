// Notifications.js
import React from 'react';

export const SuccessNotification = ({ message, onClose }) => (
    <div className="notification success">
        <p>{message}</p>
        <button onClick={onClose}>&times;</button>
    </div>
);

export const ErrorNotification = ({ message, onClose }) => (
    <div className="notification error">
        <p>{message}</p>
        <button onClick={onClose}>&times;</button>
    </div>
);
