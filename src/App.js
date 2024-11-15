// App.js
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { supabase } from './supabaseClient';
import "./App.css";

import Header from './Header';
import MonthSelector from './MonthSelector';
import DayCard from './DayCard';
import ServiceForm from './ServiceForm';
import ServiceDetailsModal from './ServiceDetailsModal';
import { SuccessNotification, ErrorNotification } from './Notifications';

// Función para obtener la cantidad de días en un mes específico
const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
};

function App() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentDay = new Date().getDate();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewedMonthIndex, setViewedMonthIndex] = useState(currentMonth - 1);
    const [services, setServices] = useState({});
    const [showForm, setShowForm] = useState(null);
    const [editingService, setEditingService] = useState(null);
    const [expandedService, setExpandedService] = useState(null);
    const [formData, setFormData] = useState({
        cliente: '',
        servicio: '',
        unidades: [
            { movil: '', choferes: ['', '', ''] }
        ],
        origen: '',
        destino: '',
        horario: '',
        observaciones: ''
    });
    const [notification, setNotification] = useState({ type: '', message: '' });

    const sliderRef = useRef(null);

    // Obtener el nombre del día de la semana
    const getDayOfWeek = useCallback((day, month, year) => {
        const date = new Date(year, month - 1, day);
        const options = { weekday: 'short' }; // 'short' para abreviar
        return new Intl.DateTimeFormat('es-ES', options).format(date);
    }, []);

    // Obtener el nombre del mes
    const getMonthName = useCallback((month) => {
        const date = new Date(0, month - 1);
        const options = { month: 'long' };
        return new Intl.DateTimeFormat('es-ES', options).format(date);
    }, []);

    // Generar los días del año
    const daysInYear = useMemo(() => {
        let days = [];
        for (let month = 1; month <= 12; month++) {
            const daysInMonth = getDaysInMonth(month, currentYear);
            for (let day = 1; day <= daysInMonth; day++) {
                days.push({ day, dayOfWeek: getDayOfWeek(day, month, currentYear), month, year: currentYear });
            }
        }
        return days;
    }, [currentYear, getDayOfWeek]);

    // Calcular el índice de la fecha actual
    const todayIndex = useMemo(() => {
        return daysInYear.findIndex(day => 
            day.day === currentDay && 
            day.month === currentMonth && 
            day.year === currentYear
        );
    }, [daysInYear, currentDay, currentMonth, currentYear]);

    // Configuración de react-slick con el índice de la fecha actual
    const settings = useMemo(() => ({
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: 6,
        slidesToScroll: 1,
        initialSlide: todayIndex !== -1 ? todayIndex : 0, // Centrar en la fecha actual
        centerMode: true,
        centerPadding: '0px',
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 4,
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                }
            }
        ],
        afterChange: (current) => {
            setCurrentIndex(current);
            const viewedMonth = daysInYear[current].month;
            setViewedMonthIndex(viewedMonth - 1);
        },
    }), [todayIndex, daysInYear]);

    // Obtener y suscribirse a los servicios
    useEffect(() => {
        const fetchServices = async () => {
            const { data: services, error } = await supabase
                .from('services')
                .select('*');
            if (error) {
                console.error('Error al obtener los servicios:', error);
                setNotification({ type: 'error', message: 'Error al obtener los servicios.' });
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

        const subscription = supabase
            .channel('public:services')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, (payload) => {
                console.log('Cambio en tiempo real:', payload);
                fetchServices();
            })
            .subscribe();

        // Establecer el índice actual al índice de hoy
        setCurrentIndex(todayIndex !== -1 ? todayIndex : 0);

        // Desplazar el slider al índice de la fecha actual
        if (sliderRef.current && todayIndex !== -1) {
            sliderRef.current.slickGoTo(todayIndex);
        }

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [todayIndex, daysInYear]);

    // Guardar servicio en la base de datos
    const saveServiceToDatabase = async (serviceData) => {
        const { error } = await supabase
            .from('services')
            .insert([serviceData]);

        if (error) {
            console.error('Error al guardar el servicio:', error);
            setNotification({ type: 'error', message: 'Error al guardar el servicio.' });
        } else {
            const dateKey = `${serviceData.year}-${serviceData.month}-${serviceData.day}`;
            setServices((prevServices) => ({
                ...prevServices,
                [dateKey]: [...(prevServices[dateKey] || []), serviceData]
            }));
            setNotification({ type: 'success', message: 'Servicio guardado exitosamente.' });
        }
    };

    // Actualizar servicio en la base de datos
    const updateServiceInDatabase = async (serviceData) => {
        const { error } = await supabase
            .from('services')
            .update(serviceData)
            .eq('id', serviceData.id);

        if (error) {
            console.error('Error al actualizar el servicio:', error);
            setNotification({ type: 'error', message: 'Error al actualizar el servicio.' });
        } else {
            const dateKey = `${serviceData.year}-${serviceData.month}-${serviceData.day}`;
            setServices((prevServices) => {
                const updatedServices = { ...prevServices };
                updatedServices[dateKey] = updatedServices[dateKey].map((s) =>
                    s.id === serviceData.id ? serviceData : s
                );
                return updatedServices;
            });
            setNotification({ type: 'success', message: 'Servicio actualizado exitosamente.' });
        }
    };

    // Añadir una nueva unidad
    const addUnidad = () => {
        setFormData((prevData) => ({
            ...prevData,
            unidades: [
                ...prevData.unidades,
                { movil: '', choferes: ['', '', ''] }
            ]
        }));
    };

    // Manejar cambios en los inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleArrayInputChange = (e, index) => {
        const { value } = e.target;
        setFormData((prevData) => {
            const updatedUnidades = [...prevData.unidades];
            updatedUnidades[index].movil = value;
            return { ...prevData, unidades: updatedUnidades };
        });
    };

    const handleChoferInputChange = (e, unidadIndex, choferIndex) => {
        const { value } = e.target;
        setFormData((prevData) => {
            const updatedUnidades = [...prevData.unidades];
            updatedUnidades[unidadIndex].choferes[choferIndex] = value;
            return { ...prevData, unidades: updatedUnidades };
        });
    };

    // Guardar servicio (nuevo o actualizado)
    const saveService = async () => {
        if (!showForm) return;

        const [year, month, day] = showForm.split('-').map(Number);
        const serviceData = {
            ...formData,
            year,
            month,
            day,
            completed: editingService ? editingService.completed : false // Preservar el estado de completado si es edición
        };

        if (editingService) {
            await updateServiceInDatabase({ ...serviceData, id: editingService.id });
        } else {
            await saveServiceToDatabase(serviceData);
        }

        setShowForm(null);
        setEditingService(null);
        setFormData({
            cliente: '',
            servicio: '',
            unidades: [{ movil: '', choferes: ['', '', ''] }],
            origen: '',
            destino: '',
            horario: '',
            observaciones: ''
        });
    };

    // Editar servicio
    const editService = (service) => {
        setFormData({
            cliente: service.cliente,
            servicio: service.servicio,
            unidades: service.unidades,
            origen: service.origen,
            destino: service.destino,
            horario: service.horario,
            observaciones: service.observaciones
        });
        setEditingService(service);
        setShowForm(`${service.year}-${service.month}-${service.day}`);
    };

    // Marcar servicio como completado
    const markAsCompleted = async (service) => {
        const { id, year, month, day } = service;
        const { error } = await supabase
            .from('services')
            .update({ completed: true })
            .eq('id', id);

        if (error) {
            console.error('Error al marcar como completado:', error);
            setNotification({ type: 'error', message: 'Error al marcar como completado.' });
        } else {
            const dateKey = `${year}-${month}-${day}`;
            setServices((prevServices) => {
                const updatedServices = { ...prevServices };
                updatedServices[dateKey] = updatedServices[dateKey].map((s) =>
                    s.id === id ? { ...s, completed: true } : s
                );
                return updatedServices;
            });
            setNotification({ type: 'success', message: 'Servicio marcado como completado.' });
        }
    };

    // Navegar al siguiente slide
    const next = () => {
        if (sliderRef.current) {
            sliderRef.current.slickNext();
        }
    };

    // Navegar al slide anterior
    const previous = () => {
        if (sliderRef.current) {
            sliderRef.current.slickPrev();
        }
    };

    // Saltar a un mes específico
    const jumpToMonth = (event) => {
        const selectedMonth = parseInt(event.target.value, 10) + 1;
        const firstDayOfMonth = daysInYear.findIndex((day) => day.month === selectedMonth);
        if (sliderRef.current && firstDayOfMonth !== -1) {
            sliderRef.current.slickGoTo(firstDayOfMonth);
        }
    };

    const displayedMonthName = getMonthName(viewedMonthIndex + 1);

    const addService = (dateKey) => {
        setShowForm(dateKey);
    };

    // Cerrar notificaciones
    const closeNotification = () => {
        setNotification({ type: '', message: '' });
    };

    return (
        <div className="app-container">
            <Header />

            {notification.message && (
                notification.type === 'success' ? (
                    <SuccessNotification message={notification.message} onClose={closeNotification} />
                ) : (
                    <ErrorNotification message={notification.message} onClose={closeNotification} />
                )
            )}

            {!showForm && (
                <>
                    <div className="top-bar">
                        <h2 className="month-viewing">{`Visualizando: ${displayedMonthName.charAt(0).toUpperCase() + displayedMonthName.slice(1)}`}</h2>
                        <MonthSelector
                            currentMonthIndex={viewedMonthIndex}
                            onSelectMonth={jumpToMonth}
                            getMonthName={getMonthName}
                        />
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
                        {daysInYear.map((day) => (
                            <DayCard
                                key={`${day.year}-${day.month}-${day.day}`}
                                day={day}
                                dayOfWeek={day.dayOfWeek}
                                services={services}
                                onAddService={addService}
                                onViewDetails={setExpandedService}
                            />
                        ))}
                    </Slider>
                )}

                {showForm && (
                    <ServiceForm
                        formData={formData}
                        onChange={handleInputChange}
                        onChangeUnidad={handleArrayInputChange}
                        onChangeChofer={handleChoferInputChange}
                        onAddUnidad={addUnidad}
                        onSubmit={saveService}
                        onCancel={() => {
                            setShowForm(null);
                            setEditingService(null);
                            setFormData({
                                cliente: '',
                                servicio: '',
                                unidades: [{ movil: '', choferes: ['', '', ''] }],
                                origen: '',
                                destino: '',
                                horario: '',
                                observaciones: ''
                            });
                        }}
                        isEditing={!!editingService}
                    />
                )}

                {expandedService && (
                    <ServiceDetailsModal
                        service={expandedService}
                        onClose={() => setExpandedService(null)}
                        onEdit={editService}
                        onMarkAsCompleted={markAsCompleted}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
