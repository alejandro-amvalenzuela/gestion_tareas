"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./Shared.module.css";

export default function CustomDatePicker({ value, onChange, label, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef(null);

  const toggleOpen = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 350);
    }
    setIsOpen(!isOpen);
  };

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      );
    }
    return new Date(dateStr);
  };

  const selectedDate = parseLocalDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (newDate >= today) {
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, "0");
      const dayStr = String(newDate.getDate()).padStart(2, "0");
      onChange(`${year}-${month}-${dayStr}`);
      setIsOpen(false);
    }
  };

  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysCount = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Empty slots before first day
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.calendarDayEmpty}></div>);
    }

    // Days of month
    for (let d = 1; d <= daysCount; d++) {
      const currentDate = new Date(year, month, d);
      const isPast = currentDate < today;
      const isSelected = selectedDate && 
                         selectedDate.getDate() === d && 
                         selectedDate.getMonth() === month && 
                         selectedDate.getFullYear() === year;

      days.push(
        <div 
          key={d} 
          className={`${styles.calendarDay} ${isPast ? styles.disabled : ""} ${isSelected ? styles.selected : ""}`}
          onClick={() => !isPast && handleDateClick(d)}
        >
          {d}
        </div>
      );
    }

    return days;
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className={styles.selectContainer} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}
      <div 
        className={`${styles.selectHeader} ${isOpen ? styles.active : ""}`} 
        onClick={toggleOpen}
      >
        <span className={selectedDate ? styles.value : styles.placeholder}>
          {selectedDate ? selectedDate.toLocaleDateString() : placeholder}
        </span>
        <CalendarIcon size={18} className={styles.icon} />
      </div>

      {isOpen && (
        <div className={`${styles.calendarDropdown} ${dropUp ? styles.dropUp : ""}`}>
          <div className={styles.calendarHeader}>
            <button type="button" onClick={handlePrevMonth}><ChevronLeft size={18} /></button>
            <span className={styles.monthLabel}>{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            <button type="button" onClick={handleNextMonth}><ChevronRight size={18} /></button>
          </div>
          <div className={styles.calendarWeekdays}>
            {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className={styles.calendarGrid}>
            {renderDays()}
          </div>
        </div>
      )}
    </div>
  );
}
