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
import LoginModal from './LoginModal';

// Importar librerías para descargar Excel y PDF
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

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

    // Estados para el filtro
    const [filter, setFilter] = useState({ cliente: '', month: '' });

    // Estado de autenticación
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Manejar cambios en el filtro
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilter((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // Manejar inicio de sesión
    const handleLogin = () => {
        setIsAuthenticated(true);
        setShowLoginModal(false);
    };

    // Manejar cierre de sesión
    const handleLogout = () => {
        setIsAuthenticated(false);
    };

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
            const { data: servicesData, error } = await supabase
                .from('services')
                .select('*');
            if (error) {
                console.error('Error al obtener los servicios:', error);
                setNotification({ type: 'error', message: 'Error al obtener los servicios.' });
            } else {
                const formattedServices = servicesData.reduce((acc, service) => {
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
        try {
            const { data, error } = await supabase
                .from('services')
                .insert([serviceData])
                .select('*'); // Aseguramos que retorna los datos insertados

            console.log('Resultado de la inserción:', { data, error });

            if (error) {
                console.error('Error al guardar el servicio:', error);
                setNotification({ type: 'error', message: `Error al guardar el servicio: ${error.message}` });
                return;
            }

            if (!data || data.length === 0) {
                console.error('No se recibió ningún dato después de la inserción.');
                setNotification({ type: 'error', message: 'No se pudo guardar el servicio. No se recibieron datos.' });
                return;
            }

            // Actualizar el estado local
            const savedService = data[0];
            const dateKey = `${savedService.year}-${savedService.month}-${savedService.day}`;
            setServices((prevServices) => {
                const updatedServices = { ...prevServices };
                if (!updatedServices[dateKey]) {
                    updatedServices[dateKey] = [];
                }
                updatedServices[dateKey].push(savedService);
                return updatedServices;
            });
            setNotification({ type: 'success', message: 'Servicio guardado exitosamente.' });
        } catch (err) {
            console.error('Error inesperado al guardar el servicio:', err);
            setNotification({ type: 'error', message: 'Error inesperado al guardar el servicio.' });
        }
    };

    // Actualizar servicio en la base de datos
    const updateServiceInDatabase = async (serviceData) => {
        try {
            const { data, error } = await supabase
                .from('services')
                .update(serviceData)
                .eq('id', serviceData.id)
                .select('*');

            console.log('Resultado de la actualización:', { data, error });

            if (error) {
                console.error('Error al actualizar el servicio:', error);
                setNotification({ type: 'error', message: `Error al actualizar el servicio: ${error.message}` });
                return;
            }

            if (!data || data.length === 0) {
                console.error('No se recibió ningún dato después de la actualización.');
                setNotification({ type: 'error', message: 'No se pudo actualizar el servicio.' });
                return;
            }

            // Actualizar el estado local
            const updatedService = data[0];
            const dateKey = `${updatedService.year}-${updatedService.month}-${updatedService.day}`;
            setServices((prevServices) => {
                const updatedServices = { ...prevServices };
                if (updatedServices[dateKey]) {
                    updatedServices[dateKey] = updatedServices[dateKey].map((service) =>
                        service.id === updatedService.id ? updatedService : service
                    );
                }
                return updatedServices;
            });
            setNotification({ type: 'success', message: 'Servicio actualizado exitosamente.' });
        } catch (err) {
            console.error('Error inesperado al actualizar el servicio:', err);
            setNotification({ type: 'error', message: 'Error inesperado al actualizar el servicio.' });
        }
    };

    // Eliminar servicio de la base de datos
    const deleteService = async (service) => {
        if (!isAuthenticated) {
            setNotification({ type: 'error', message: 'Debes iniciar sesión para eliminar servicios.' });
            return;
        }

        const { id } = service;
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error al eliminar el servicio:', error);
            setNotification({ type: 'error', message: 'Error al eliminar el servicio.' });
        } else {
            const dateKey = `${service.year}-${service.month}-${service.day}`;
            setServices((prevServices) => {
                const updatedServices = { ...prevServices };
                if (updatedServices[dateKey]) {
                    updatedServices[dateKey] = updatedServices[dateKey].filter(s => s.id !== id);
                    if (updatedServices[dateKey].length === 0) {
                        delete updatedServices[dateKey];
                    }
                }
                return updatedServices;
            });
            setNotification({ type: 'success', message: 'Servicio eliminado exitosamente.' });
            setExpandedService(null);
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
        if (!isAuthenticated) {
            setNotification({ type: 'error', message: 'Debes iniciar sesión para editar servicios.' });
            return;
        }

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
        setExpandedService(null);
    };

    // Marcar servicio como completado
    const markAsCompleted = async (service) => {
        if (!isAuthenticated) {
            setNotification({ type: 'error', message: 'Debes iniciar sesión para marcar servicios como completados.' });
            return;
        }

        const { id } = service;
        const { data, error } = await supabase
            .from('services')
            .update({ completed: true })
            .eq('id', id)
            .select('*');

        if (error) {
            console.error('Error al marcar como completado:', error);
            setNotification({ type: 'error', message: 'Error al marcar como completado.' });
        } else if (!data || data.length === 0) {
            console.error('No se recibió ningún dato después de marcar como completado.');
            setNotification({ type: 'error', message: 'No se pudo marcar el servicio como completado.' });
        } else {
            const updatedService = data[0];
            const dateKey = `${updatedService.year}-${updatedService.month}-${updatedService.day}`;
            setServices((prevServices) => {
                const updatedServices = { ...prevServices };
                if (updatedServices[dateKey]) {
                    updatedServices[dateKey] = updatedServices[dateKey].map((s) =>
                        s.id === updatedService.id ? updatedService : s
                    );
                }
                return updatedServices;
            });
            setNotification({ type: 'success', message: 'Servicio marcado como completado.' });
            setExpandedService(null);
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

    // Modificar addService para verificar autenticación
    const addService = (dateKey) => {
        if (isAuthenticated) {
            setShowForm(dateKey);
        } else {
            setNotification({ type: 'error', message: 'Debes iniciar sesión para agregar servicios.' });
            setShowLoginModal(true);
        }
    };

    // Cerrar notificaciones
    const closeNotification = () => {
        setNotification({ type: '', message: '' });
    };

    // Descargar Excel
    const downloadExcel = () => {
        const servicesArray = Object.values(filteredServices).flat();
        const worksheetData = servicesArray.map(service => ({
            Fecha: `${service.day}/${service.month}/${service.year}`,
            Cliente: service.cliente,
            Servicio: service.servicio,
            Unidades: service.unidades.map(u => `Móvil: ${u.movil}, Choferes: ${u.choferes.join(', ')}`).join(' | '),
            Origen: service.origen,
            Destino: service.destino,
            Horario: service.horario,
            Observaciones: service.observaciones,
            Completado: service.completed ? 'Sí' : 'No'
        }));
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Servicios");
        XLSX.writeFile(workbook, "Servicios.xlsx");
    };

    // Descargar PDF
    const downloadPDF = () => {
        const doc = new jsPDF();
        const servicesArray = Object.values(filteredServices).flat();

        doc.setFontSize(12);
        doc.text("Servicios", 10, 10);
        let yOffset = 20;

        servicesArray.forEach((service, index) => {
            const text = `${index + 1}. Fecha: ${service.day}/${service.month}/${service.year}, Cliente: ${service.cliente}, Servicio: ${service.servicio}`;
            doc.text(text, 10, yOffset);
            yOffset += 10;

            if (yOffset > 280) {
                doc.addPage();
                yOffset = 20;
            }
        });

        doc.save("Servicios.pdf");
    };

    // Filtrar los servicios
    const filteredServices = useMemo(() => {
        const filterByClient = (service) =>
            !filter.cliente || service.cliente.toLowerCase().includes(filter.cliente.toLowerCase());

        const filterByMonth = (service) =>
            !filter.month || service.month === parseInt(filter.month, 10);

        // Filtrar los servicios y mantener la estructura original
        return Object.keys(services).reduce((acc, dateKey) => {
            const dayServices = services[dateKey].filter(service => filterByClient(service) && filterByMonth(service));
            acc[dateKey] = dayServices;
            return acc;
        }, {});
    }, [filter, services]);

    return (
        <div className="app-container">
            <Header
                isAuthenticated={isAuthenticated}
                onLogout={handleLogout}
                onLogin={() => setShowLoginModal(true)}
            />

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

                    <div className="filter-container">
                        <input
                            type="text"
                            name="cliente"
                            placeholder="Buscar por cliente"
                            value={filter.cliente}
                            onChange={handleFilterChange}
                        />
                        <select name="month" value={filter.month} onChange={handleFilterChange}>
                            <option value="">Todos los meses</option>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i + 1}>
                                    {getMonthName(i + 1).charAt(0).toUpperCase() + getMonthName(i + 1).slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="download-buttons">
                        <button className="button" onClick={downloadExcel}>Descargar Excel</button>
                        <button className="button" onClick={downloadPDF}>Descargar PDF</button>
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
                        {daysInYear.map((day) => {
                            const dateKey = `${day.year}-${day.month}-${day.day}`;
                            return (
                                <DayCard
                                    key={dateKey}
                                    day={day}
                                    dayOfWeek={day.dayOfWeek}
                                    services={filteredServices}
                                    onAddService={addService}
                                    onViewDetails={setExpandedService}
                                    isAuthenticated={isAuthenticated}
                                />
                            );
                        })}
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
                        onDelete={deleteService}
                        isAuthenticated={isAuthenticated}
                    />
                )}
            </div>

            {showLoginModal && (
                <LoginModal
                    onLogin={handleLogin}
                    onClose={() => setShowLoginModal(false)}
                />
            )}
        </div>
    );
}

export default App;
