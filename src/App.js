import React, { useState, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Función para obtener el nombre del día de la semana
const getDayOfWeek = (day, month, year) => {
    const date = new Date(year, month - 1, day); // mes - 1 porque los meses en Date comienzan en 0
    const options = { weekday: 'long' };
    return new Intl.DateTimeFormat('es-ES', options).format(date);
};

// Función para obtener el nombre del mes
const getMonthName = (month) => {
    const date = new Date(0, month - 1); // mes - 1 porque Date empieza desde 0
    const options = { month: 'long' };
    return new Intl.DateTimeFormat('es-ES', options).format(date);
};

// Función para obtener el número de días en un mes
const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate(); // Día 0 es el último día del mes anterior
};

function App() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // Obtener el mes actual

    // Estado para el índice actual del carrusel y el mes visualizado
    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewedMonthIndex, setViewedMonthIndex] = useState(0); // Índice para ver qué mes se está visualizando

    // Estado para almacenar los servicios por día
    const [services, setServices] = useState({});

    // Crear una referencia para el carrusel
    const sliderRef = useRef(null);

    // Generar los días con sus nombres correspondientes a partir del mes actual
    const generateDays = (startingMonth, startingYear, numberOfDays) => {
        let days = [];
        let month = startingMonth;
        let year = startingYear;
        let dayCount = 0;

        while (dayCount < numberOfDays) {
            const daysInMonth = getDaysInMonth(month, year);
            for (let day = 1; day <= daysInMonth; day++) {
                days.push({ day, dayOfWeek: getDayOfWeek(day, month, year), month, year });
                dayCount++;
                if (dayCount >= numberOfDays) break;
            }
            month = (month % 12) + 1;
            if (month === 1) year++; // Avanzar al próximo año si llegamos a enero
        }

        return days;
    };

    // Generamos 120 días, 60 días actuales + los 60 días del siguiente mes.
    const daysInMonth = generateDays(currentMonth, currentYear, 120);

    // Definir el estilo del botón
    const buttonStyle = {
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        padding: "10px",
        cursor: "pointer",
        borderRadius: "5px",
        margin: "0 5px",
    };

    // Configuración del carrusel
    const settings = {
        dots: false, // Desactivar los puntos
        infinite: false,
        speed: 500,
        slidesToShow: 7, // Mostrar 7 días por pantalla
        slidesToScroll: 1,
        afterChange: (current) => {
            setCurrentIndex(current);
            const viewedMonth = daysInMonth[current].month;
            setViewedMonthIndex(viewedMonth - currentMonth); // Calcular la diferencia de mes
        },
    };

    // Funciones para avanzar y retroceder libremente
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

    // Función para saltar rápidamente a un mes
    const jumpToMonth = (event) => {
        const selectedMonth = parseInt(event.target.value, 10);
        const firstDayOfMonth = daysInMonth.findIndex((day) => day.month === selectedMonth);
        if (sliderRef.current && firstDayOfMonth !== -1) {
            sliderRef.current.slickGoTo(firstDayOfMonth);
        }
    };

    // Obtener el mes visualizado actualmente
    const viewedMonth = currentMonth + viewedMonthIndex;
    const displayedMonthName = getMonthName(viewedMonth);

    // Función para agregar un servicio a un día específico
    const addService = (dateKey) => {
        const service = prompt("Ingresa el nombre del servicio:");
        if (service) {
            setServices((prevServices) => {
                const updatedServices = { ...prevServices };
                if (updatedServices[dateKey]) {
                    updatedServices[dateKey].push(service);
                } else {
                    updatedServices[dateKey] = [service];
                }
                return updatedServices;
            });
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <header>
                <h1>Planificación de Servicios</h1>
            </header>

            {/* Mostrar el mes actual visualizado */}
            <h2 style={{ textAlign: "center" }}>Visualizando: {displayedMonthName}</h2>

            {/* Selector para saltar rápidamente a un mes */}
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
                <label htmlFor="monthSelector">Ir al mes: </label>
                <select id="monthSelector" onChange={jumpToMonth}>
                    {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                            {getMonthName(i + 1)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Botones para avanzar y retroceder libremente */}
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
                <button style={buttonStyle} onClick={previous} disabled={currentIndex === 0}>
                    Anterior
                </button>
                <button
                    style={buttonStyle}
                    onClick={next}
                    disabled={currentIndex >= daysInMonth.length - 7}
                >
                    Siguiente
                </button>
            </div>

            <div style={{ marginTop: "10px" }}>
                {/* Carrusel */}
                <Slider ref={sliderRef} {...settings}>
                    {daysInMonth.map(({ day, dayOfWeek, month, year }) => {
                        const dateKey = `${year}-${month}-${day}`; // Clave única para cada día
                        return (
                            <div key={dateKey} style={{ padding: "10px", textAlign: "center" }}>
                                <div
                                    style={{
                                        padding: "20px",
                                        backgroundColor: "#f5f5f5",
                                        borderRadius: "8px",
                                        position: "relative",
                                        minHeight: "150px",
                                    }}
                                >
                                    <h3>{`${dayOfWeek} ${day}`}</h3>
                                    {/* Botón para agregar servicio */}
                                    <button
                                        style={{
                                            ...buttonStyle,
                                            position: "absolute",
                                            top: "10px",
                                            right: "10px",
                                            padding: "5px 10px",
                                            fontSize: "12px",
                                        }}
                                        onClick={() => addService(dateKey)}
                                    >
                                        + Servicio
                                    </button>
                                    {/* Mostrar los servicios añadidos */}
                                    <div style={{ marginTop: "10px", textAlign: "left" }}>
                                        {services[dateKey] && services[dateKey].length > 0 && (
                                            <ul style={{ paddingLeft: "20px", textAlign: "left" }}>
                                                {services[dateKey].map((service, index) => (
                                                    <li key={index}>{service}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </Slider>
            </div>
        </div>
    );
}

export default App;
