import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './Calendario.css';

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

function Calendario({ selectedDate, setSelectedDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) days.push({ day: prevMonthDays - i, curr: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, curr: true });
    for (let i = 1; days.length < 42; i++) days.push({ day: i, curr: false });
    return days;
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1);
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };
  
  const selectDay = (day, curr) => curr && setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  
  const isSelected = (day, curr) => curr && selectedDate.getDate() === day && 
    selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();

  const days = getDays();

  return (
    <div className='calendario'>
      <div className='calendario-header'>
        <FaCalendarAlt size={18} />
        <strong>Selecionar Dia</strong>
      </div>

      <div className='calendario-navigation'>
        <button className='calendario-nav-button' onClick={() => changeMonth(-1)}>
          <FaChevronLeft size={16} />
        </button>
        <span className='calendario-month'>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <button className='calendario-nav-button' onClick={() => changeMonth(1)}>
          <FaChevronRight size={16} />
        </button>
      </div>

      <div className='calendario-grid'>
        {weekDays.map(d => <div key={d} className='calendario-weekday'>{d}</div>)}
        {days.map((d, i) => (
          <div key={i} className={`calendario-day ${!d.curr ? 'other-month' : ''} ${isSelected(d.day, d.curr) ? 'selected' : ''}`}
            onClick={() => selectDay(d.day, d.curr)}>{d.day}</div>
        ))}
      </div>

      <div className='calendario-selected-info'>
        <div className='calendario-selected-label'>Data selecionada</div>
        <div className='calendario-selected-date'>
          {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]} de {selectedDate.getFullYear()}
        </div>
      </div>
    </div>
  );
}

export default Calendario;