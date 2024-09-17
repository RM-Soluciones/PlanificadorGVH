import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function App() {
    // Generar los días del mes
    const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

    // Configuración del carrusel
    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 7, // Mostrar 7 días por pantalla
        slidesToScroll: 1,
    };

    return (
        <div style={{ padding: "20px" }}>
            <header>
                <h1>Planificación de Servicios</h1>
            </header>
            <div style={{ marginTop: "20px" }}>
                <Slider {...settings}>
                    {daysInMonth.map((day) => (
                        <div key={day} style={{ padding: "10px", textAlign: "center" }}>
                            <div
                                style={{
                                    padding: "20px",
                                    backgroundColor: "#f5f5f5",
                                    borderRadius: "8px",
                                }}
                            >
                                <h3>{`Día ${day}`}</h3>
                            </div>
                        </div>
                    ))}
                </Slider>
            </div>
        </div>
    );
}

export default App;
