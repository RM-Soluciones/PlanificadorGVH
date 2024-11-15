// ServiceForm.js
import React from 'react';
import { FaTimes } from 'react-icons/fa';

const ServiceForm = ({
    formData,
    onChange,
    onChangeUnidad,
    onChangeChofer,
    onAddUnidad,
    onSubmit,
    onCancel,
    isEditing,
}) => (
    <div className="form-container">
        <div className="form-header">
            <h4>{isEditing ? "Editar servicio" : "Añadir servicio"}</h4>
            <button className="icon-button close-btn" onClick={onCancel}>
                <FaTimes />
            </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
            <div className="form-group">
                <label>Cliente:</label>
                <input
                    type="text"
                    name="cliente"
                    value={formData.cliente}
                    onChange={onChange}
                    required
                />
            </div>
            <div className="form-group">
                <label>Servicio:</label>
                <input
                    type="text"
                    name="servicio"
                    value={formData.servicio}
                    onChange={onChange}
                    required
                />
            </div>
            {formData.unidades.map((unidad, index) => (
                <div key={index} className="unidad-box">
                    <div className="form-group">
                        <label>Movil:</label>
                        <input
                            type="text"
                            value={unidad.movil}
                            onChange={(e) => onChangeUnidad(e, index)}
                            required
                        />
                    </div>
                    {unidad.choferes.map((chofer, choferIndex) => (
                        <div key={choferIndex} className="form-group">
                            <label>{`Chofer ${choferIndex + 1}:`}</label>
                            <input
                                type="text"
                                value={chofer}
                                onChange={(e) => onChangeChofer(e, index, choferIndex)}
                            />
                        </div>
                    ))}
                </div>
            ))}
            <button type="button" onClick={onAddUnidad} className="button add-more-btn">
                + Añadir otra unidad
            </button>
            <div className="form-group">
                <label>Origen:</label>
                <input
                    type="text"
                    name="origen"
                    value={formData.origen}
                    onChange={onChange}
                    required
                />
            </div>
            <div className="form-group">
                <label>Destino:</label>
                <input
                    type="text"
                    name="destino"
                    value={formData.destino}
                    onChange={onChange}
                    required
                />
            </div>
            <div className="form-group">
                <label>Horario:</label>
                <input
                    type="time"
                    name="horario"
                    value={formData.horario}
                    onChange={onChange}
                    required
                />
            </div>
            <div className="form-group">
                <label>Observaciones:</label>
                <input
                    type="text"
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={onChange}
                />
            </div>
            <div className="form-actions">
                <button type="submit" className="button save-btn">
                    {isEditing ? "Actualizar Servicio" : "Guardar Servicio"}
                </button>
                <button type="button" onClick={onCancel} className="button cancel-btn">
                    Cerrar
                </button>
            </div>
        </form>
    </div>
);

export default ServiceForm;
