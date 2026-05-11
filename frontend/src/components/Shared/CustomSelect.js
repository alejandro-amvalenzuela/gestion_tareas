"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./Shared.module.css";

export default function CustomSelect({ options, value, onChange, placeholder, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const containerRef = useRef(null);

  const toggleOpen = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 250);
    }
    setIsOpen(!isOpen);
  };

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.selectContainer} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}
      <div 
        className={`${styles.selectHeader} ${isOpen ? styles.active : ""}`} 
        onClick={toggleOpen}
      >
        <span className={selectedOption ? styles.value : styles.placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className={`${styles.icon} ${isOpen ? styles.rotate : ""}`} />
      </div>

      {isOpen && (
        <div className={`${styles.optionsList} ${dropUp ? styles.dropUp : ""}`}>
          {options.map((option) => (
            <div 
              key={option.value} 
              className={`${styles.optionItem} ${value === option.value ? styles.selected : ""}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
