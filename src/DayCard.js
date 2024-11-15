// DayCard.js

import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa';

const DayCard = ({
    day,
    dayOfWeek,
    services,
    onAddService,
    onViewDetails,
}) => {
    const dateKey = `${day.year}-${day.month}-${day.day}`;
    const [isOpen, setIsOpen] = useState(true); // Estado inicial abierto

    const toggleServices = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="day-card">
            <div className="day-header" onClick={toggleServices}>
                <div>
                    <strong>{`${dayOfWeek.slice(0, 3)} ${day.day}`}</strong>
                </div>
            </div>
            {isOpen && (
                <div className="service-list">
                    <button className="icon-button add-service-btn" onClick={() => onAddService(dateKey)}>
                        <FaPlus /> Añadir
                    </button>
                    {services[dateKey] && services[dateKey].length > 0 ? (
                        <ul className="service-items">
                            {services[dateKey].map((service) => (
                                <li
                                    key={service.id}
                                    className={`service-item ${service.completed ? 'completed' : ''}`}
                                    onClick={() => onViewDetails(service)}
                                >
                                    <div className="service-info">
                                        <span><strong>{service.cliente}</strong></span>
                                        <span>{service.servicio}</span>
                                        <span><strong>Móvil:</strong> {service.unidades[0].movil}</span>
                                        <span><strong>Origen:</strong> {service.origen}</span>
                                        <span><strong>Destino:</strong> {service.destino}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-services">No hay servicios para este día.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default DayCard;
