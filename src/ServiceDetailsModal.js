// ServiceDetailsModal.js
import React from 'react';
import { FaTimes, FaEdit, FaCheck, FaTrash } from 'react-icons/fa';

const ServiceDetailsModal = ({
    service,
    onClose,
    onEdit,
    onMarkAsCompleted,
    onDelete,
    isAuthenticated,
}) => (
    <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
                <h2>Detalles del Servicio</h2>
                <button className="icon-button close-btn" onClick={onClose}>
                    <FaTimes />
                </button>
            </div>
            <div className="modal-body">
                <p><strong>Cliente:</strong> {service.cliente}</p>
                <p><strong>Servicio:</strong> {service.servicio}</p>
                <p><strong>Móvil:</strong> {service.unidades[0].movil}</p>
                <p><strong>Origen:</strong> {service.origen}</p>
                <p><strong>Destino:</strong> {service.destino}</p>
                <p><strong>Horario de Inicio:</strong> {service.horario}</p>
                <p><strong>Observaciones:</strong> {service.observaciones}</p>
                <div className="service-choferes">
                    <strong>Choferes:</strong>
                    <ul>
                        {service.unidades[0].choferes.filter(chofer => chofer).map((chofer, index) => (
                            <li key={index}>{chofer}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="modal-actions">
                {isAuthenticated && (
                    <>
                        {!service.completed && (
                            <button
                                className="button mark-completed-btn"
                                onClick={() => onMarkAsCompleted(service)}
                            >
                                <FaCheck /> Marcar como Finalizado
                            </button>
                        )}
                        <button className="button edit-btn" onClick={() => onEdit(service)}>
                            <FaEdit /> Editar Servicio
                        </button>
                        <button className="button delete-btn" onClick={() => onDelete(service)}>
                            <FaTrash /> Eliminar Servicio
                        </button>
                    </>
                )}
            </div>
        </div>
    </div>
);

export default ServiceDetailsModal;
