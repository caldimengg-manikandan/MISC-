import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Filter, Plus } from 'lucide-react';
import { useEstimation } from '../../contexts/EstimationContext';
import './Calendar.css';

export default function Calendar() {
  const navigate = useNavigate();
  const { estimations, fetchEstimations, loading } = useEstimation();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchEstimations();
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => {
    return (
      <div className="cal-view-header">
        <div className="cal-view-title">
          <h1>Calendar</h1>
          <p>Deadlines and estimation schedule</p>
        </div>
        <div className="cal-view-actions">
           <div className="cal-nav">
             <button onClick={prevMonth} className="btn-icon-sq"><ChevronLeft size={20}/></button>
             <span className="cal-month-name">{format(currentMonth, 'MMMM yyyy')}</span>
             <button onClick={nextMonth} className="btn-icon-sq"><ChevronRight size={20}/></button>
           </div>
           <button className="btn-outline"><Filter size={18} /> Filters</button>
           <button className="btn-primary" onClick={() => navigate('/project-info')}>
             <Plus size={18} /> New Estimation
           </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return (
      <div className="cal-view-days-row">
        {days.map((day, index) => (
          <div className="cal-view-day-label" key={index}>{day}</div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        // Find projects for this day
        const dayProjects = estimations.filter(p => {
          if (!p.dueDate) return false;
          return isSameDay(new Date(p.dueDate), cloneDay);
        });

        days.push(
          <div
            className={`cal-view-cell ${!isSameMonth(day, monthStart) ? 'disabled' : ''} ${isToday(day) ? 'today' : ''}`}
            key={day.toString()}
          >
            <span className="cal-view-number">{formattedDate}</span>
            <div className="cal-view-events">
              {dayProjects.map(p => (
                <div 
                  key={p.id} 
                  className={`cal-view-event status-${p.status ? p.status.replace(/\s+/g, '-').toLowerCase() : 'new'}`}
                  onClick={() => navigate('/project-info?id=' + p.id)}
                >
                  <span className="event-pno">#{p.id.toString().slice(-6).toUpperCase()}</span>
                  <span className="event-name">{p.projectName}</span>
                </div>
              ))}
            </div>
          </div>
        );
        day = new Date(day.setDate(day.getDate() + 1));
      }
      rows.push(
        <div className="cal-view-row" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="cal-view-body">{rows}</div>;
  };

  return (
    <div className="full-calendar-page">
      {renderHeader()}
      <div className="cal-view-container shadow-sm">
        {renderDays()}
        {renderCells()}
      </div>
    </div>
  );
}
