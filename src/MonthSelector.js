// MonthSelector.js
import React from 'react';

const MonthSelector = ({ currentMonthIndex, onSelectMonth, getMonthName }) => (
    <div className="month-selector">
        <label htmlFor="monthSelector">Ir al mes: </label>
        <select id="monthSelector" value={currentMonthIndex} onChange={onSelectMonth}>
            {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i}>
                    {getMonthName(i + 1)}
                </option>
            ))}
        </select>
    </div>
);

export default MonthSelector;
