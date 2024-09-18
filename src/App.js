import React, { useState, useRef, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { supabase } from './supabaseClient'; // Importamos el cliente de Supabase
import "./App.css";

const getDayOfWeek = (day, month, year) => {
    const date = new Date(year, month - 1, day);
    const options = { weekday: 'long' };
    return new Intl.DateTimeFormat('es-ES', options).format(date);
};

const getMonthName = (month) => {
    const date = new Date(0, month - 1);
    const options = { month: 'long' };
    return new Intl.DateTimeFormat('es-ES', options).format(date);
};

const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
};

function App() {
    const currentYear = new Date().getFullYear();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewedMonthIndex, setViewedMonthIndex] = useState(new Date().getMonth());
    const [services, setServices] = useState({});
    const [showForm, setShowForm] = useState(null);
    const [expandedService, setExpandedService] = useState(null);
    const [formData, setFormData] = useState({
        cliente: '',
        servicio: '',
        moviles: [{ movil: '' }],
        choferes: [{ chofer: '' }],
        origen: '',
        destino: '',
        horario: '',
        observaciones: ''
    });

    const sliderRef = useRef(null);
    const daysInYear = generateDaysForYear(currentYear);

    // Configuración del slider
    const settings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: 6,
        slidesToScroll: 1,
        afterChange: (current) => {
            setCurrentIndex(current);
            const viewedMonth = daysInYear[current].month;
            setViewedMonthIndex(viewedMonth - 1);
        },
    };

    // Obtener los servicios de Supabase al cargar la app
    useEffect(() => {
        const fetchServices = async () => {
            const { data: services, error } = await supabase
                .from('services')
                .select('*');
            if (error) {
                console.error('Error al obtener los servicios:', error);
            } else {
                const formattedServices = services.reduce((acc, service) => {
                    const dateKey = `${service.year}-${service.month}-${service.day}`;
                    if (!acc[dateKey]) {
                        acc[dateKey] = [];
                    }
                    acc[dateKey].push(service);
                    return acc;
                }, {});
                setServices(formattedServices);
            }
        };
        fetchServices();
    }, []);

    // Guardar un servicio en Supabase
    const saveServiceToDatabase = async (serviceData) => {
        const { error } = await supabase
            .from('services')
            .insert([serviceData]); // Eliminar variable 'data' no usada

        if (error) {
            console.error('Error al guardar el servicio:', error);
        } else {
            console.log('Servicio guardado');
            // Actualizar el estado con el nuevo servicio
            const dateKey = `${serviceData.year}-${serviceData.month}-${serviceData.day}`;
            setServices((prevServices) => ({
                ...prevServices,
                [dateKey]: [...(prevServices[dateKey] || []), serviceData]
            }));
        }
    };

    const next = () => {
        if (sliderRef.current) {
            sliderRef.current.slickNext();
        }
    };

    const previous = () => {
        if (sliderRef.current) {
            sliderRef.current.slickPrev();
        }
    };

    const jumpToMonth = (event) => {
        const selectedMonth = parseInt(event.target.value, 10);
        const firstDayOfMonth = daysInYear.findIndex((day) => day.month === selectedMonth + 1);
        if (sliderRef.current && firstDayOfMonth !== -1) {
            sliderRef.current.slickGoTo(firstDayOfMonth);
        }
    };

    const displayedMonthName = getMonthName(viewedMonthIndex + 1);

    const addService = (dateKey) => {
        setShowForm(dateKey);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleArrayInputChange = (e, index, field, type) => {
        if (!formData[type]) return;

        const updatedData = formData[type].map((item, i) =>
            i === index ? { ...item, [field]: e.target.value } : item
        );
        setFormData((prevData) => ({
            ...prevData,
            [type]: updatedData,
        }));
    };

    const addMovil = () => {
        setFormData((prevData) => ({
            ...prevData,
            moviles: [...(prevData.moviles || []), { movil: '' }]
        }));
    };

    const addChofer = () => {
        setFormData((prevData) => ({
            ...prevData,
            choferes: [...(prevData.choferes || []), { chofer: '' }]
        }));
    };

    const saveService = (dateKey) => {
        const [year, month, day] = dateKey.split('-');
        const serviceData = {
            ...formData,
            year: parseInt(year),
            month: parseInt(month),
            day: parseInt(day),
            completed: false
        };
        saveServiceToDatabase(serviceData);
        setShowForm(null);
        setFormData({
            cliente: '',
            servicio: '',
            moviles: [{ movil: '' }],
            choferes: [{ chofer: '' }],
            origen: '',
            destino: '',
            horario: '',
            observaciones: ''
        });
    };

    const markAsCompleted = async (dateKey, index) => {
        const service = services[dateKey][index];
        const { error } = await supabase
            .from('services')
            .update({ completed: true })
            .eq('id', service.id);

        if (error) {
            console.error('Error al marcar como completado:', error);
        } else {
            const updatedServices = { ...services };
            updatedServices[dateKey][index].completed = true;
            setServices(updatedServices);
        }
    };

    return (
        <div className="app-container">
            <header className="header">
                <h1>Planificación de Servicios</h1>
            </header>

            {!showForm && (
                <>
                    <h2 className="month-viewing">Visualizando: {displayedMonthName}</h2>

                    <div className="month-selector">
                        <label htmlFor="monthSelector">Ir al mes: </label>
                        <select id="monthSelector" onChange={jumpToMonth}>
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i}>
                                    {getMonthName(i + 1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="slider-controls">
                        <button className="button" onClick={previous} disabled={currentIndex === 0}>
                            Anterior
                        </button>
                        <button
                            className="button"
                            onClick={next}
                            disabled={currentIndex >= daysInYear.length - 7}
                        >
                            Siguiente
                        </button>
                    </div>
                </>
            )}

            <div className="slider-container">
                {!showForm && (
                    <Slider ref={sliderRef} {...settings}>
                        {daysInYear.map(({ day, dayOfWeek, month, year }) => {
                            const dateKey = `${year}-${month}-${day}`;
                            return (
                                <div key={dateKey} className="day-card">
                                    <div className="day-card-content">
                                        <h3>{`${dayOfWeek} ${day}`}</h3>

                                        <button className="add-service-btn" onClick={() => addService(dateKey)}>
                                            + Servicio
                                        </button>

                                        <div className="service-list">
                                            {services[dateKey] && services[dateKey].length > 0 && (
                                                <div className="service-list-items">
                                                    {services[dateKey].map((service, index) => (
                                                        <div key={index} className="service-card">
                                                            <p><strong>Cliente:</strong> {service.cliente}</p>
                                                            <p><strong>Servicio:</strong> {service.servicio}</p>
                                                            {service.moviles?.map((movil, idx) => (
                                                                <p key={idx}><strong>Móvil:</strong> {movil.movil}</p>
                                                            ))}
                                                            {service.choferes?.map((chofer, idx) => (
                                                                <p key={idx}><strong>Chofer:</strong> {chofer.chofer}</p>
                                                            ))}

                                                            <button
                                                                className="button"
                                                                onClick={() => setExpandedService(service)}
                                                            >
                                                                Ver detalles
                                                            </button>

                                                            <button
                                                                className="button completed-btn"
                                                                onClick={() => markAsCompleted(dateKey, index)}
                                                            >
                                                                {service.completed ? "Finalizado" : "Marcar como Finalizado"}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </Slider>
                )}

                {showForm && (
                    <div className="form-container">
                        <h4>Añadir servicio</h4>
                        <label>Cliente:</label>
                        <input
                            type="text"
                            name="cliente"
                            value={formData.cliente}
                            onChange={handleInputChange}
                        />
                        <label>Servicio:</label>
                        <input
                            type="text"
                            name="servicio"
                            value={formData.servicio}
                            onChange={handleInputChange}
                        />
                        {formData.moviles?.map((movil, index) => (
                            <div key={index}>
                                <label>Móvil:</label>
                                <input
                                    type="text"
                                    value={movil.movil}
                                    onChange={(e) => handleArrayInputChange(e, index, 'movil', 'moviles')}
                                />
                            </div>
                        ))}
                        {formData.choferes?.map((chofer, index) => (
                            <div key={index}>
                                <label>Chofer:</label>
                                <input
                                    type="text"
                                    value={chofer.chofer}
                                    onChange={(e) => handleArrayInputChange(e, index, 'chofer', 'choferes')}
                                />
                            </div>
                        ))}
                        <div className="add-more-buttons">
                            <button onClick={addMovil} className="button add-more-btn">
                                + Añadir otro Móvil
                            </button>
                            <button onClick={addChofer} className="button add-more-btn">
                                + Añadir otro Chofer
                            </button>
                        </div>
                        <label>Origen:</label>
                        <input
                            type="text"
                            name="origen"
                            value={formData.origen}
                            onChange={handleInputChange}
                        />
                        <label>Destino:</label>
                        <input
                            type="text"
                            name="destino"
                            value={formData.destino}
                            onChange={handleInputChange}
                        />
                        <label>Horario:</label>
                        <input
                            type="text"
                            name="horario"
                            value={formData.horario}
                            onChange={handleInputChange}
                        />
                        <label>Observaciones:</label>
                        <input
                            type="text"
                            name="observaciones"
                            value={formData.observaciones}
                            onChange={handleInputChange}
                        />
                        <button onClick={() => saveService(showForm)} className="button save-btn">
                            Guardar Servicio
                        </button>
                        <button onClick={() => setShowForm(null)} className="button cancel-btn">
                            Cancelar
                        </button>
                    </div>
                )}

                {expandedService && (
                    <div className="modal" onClick={() => setExpandedService(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>Detalles del Servicio</h2>
                            <p><strong>Cliente:</strong> {expandedService.cliente}</p>
                            <p><strong>Servicio:</strong> {expandedService.servicio}</p>
                            {expandedService.moviles?.map((movil, index) => (
                                <p key={index}><strong>Móvil:</strong> {movil.movil}</p>
                            ))}
                            {expandedService.choferes?.map((chofer, index) => (
                                <p key={index}><strong>Chofer:</strong> {chofer.chofer}</p>
                            ))}
                            <p><strong>Origen:</strong> {expandedService.origen}</p>
                            <p><strong>Destino:</strong> {expandedService.destino}</p>
                            <p><strong>Horario:</strong> {expandedService.horario}</p>
                            <p><strong>Observaciones:</strong> {expandedService.observaciones}</p>
                            <button className="button close-btn" onClick={() => setExpandedService(null)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function generateDaysForYear(year) {
    let days = [];
    for (let month = 1; month <= 12; month++) {
        const daysInMonth = getDaysInMonth(month, year);
        for (let day = 1; day <= daysInMonth; day++) {
            days.push({ day, dayOfWeek: getDayOfWeek(day, month, year), month, year });
        }
    }
    return days;
}

export default App;
