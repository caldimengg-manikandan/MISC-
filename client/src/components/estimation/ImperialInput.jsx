// src/components/estimation/ImperialInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Calculator, HelpCircle } from 'lucide-react';

const ImperialInput = ({ value, onChange, label, placeholder = "0-0", ...props }) => {
  const [inputValue, setInputValue] = useState('');
  const [displayValue, setDisplayValue] = useState(''); // What user sees
  const [showDecimal, setShowDecimal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);
  const lastProcessedValue = useRef('');

  // Parse imperial input to decimal feet
  const parseImperialToDecimal = (str) => {
    if (!str) return 0;
    
    str = str.trim();
    let feet = 0;
    let inches = 0;
    let fraction = 0;
    
    // Handle feet-inches format with dash: 11-2 1/2
    if (str.includes('-')) {
      const parts = str.split('-');
      feet = parseFloat(parts[0]) || 0;
      
      if (parts[1]) {
        const inchParts = parts[1].trim().split(' ');
        if (inchParts[0]) {
          inches = parseFloat(inchParts[0]) || 0;
        }
        if (inchParts[1] && inchParts[1].includes('/')) {
          const [num, den] = inchParts[1].split('/');
          fraction = parseFloat(num) / parseFloat(den);
        }
      }
    } 
    // Handle plain number: if it's just a number, we need context
    else {
      const num = parseFloat(str);
      if (!isNaN(num)) {
        // Default: treat as inches (this is what you wanted)
        inches = num;
      }
    }
    
    // Convert everything to decimal feet
    const totalInches = inches + fraction;
    const decimalFeet = feet + (totalInches / 12);
    
    return isNaN(decimalFeet) ? 0 : decimalFeet;
  };

  // Format decimal feet to imperial string
  const formatDecimalToImperial = (decimalFeet) => {
    if (decimalFeet === undefined || decimalFeet === null || isNaN(decimalFeet)) return '';
    
    const totalInches = decimalFeet * 12;
    const feet = Math.floor(totalInches / 12);
    const remainingInches = totalInches % 12;
    const inches = Math.floor(remainingInches);
    const fractionalInches = remainingInches - inches;
    
    let result = '';
    
    if (feet > 0) {
      result += `${feet}'`;
    }
    
    if (inches > 0 || fractionalInches > 0) {
      if (feet > 0) result += '-';
      result += `${inches}`;
    }
    
    // Handle fractions
    if (fractionalInches > 0) {
      const fraction = getClosestFraction(fractionalInches);
      result += ` ${fraction}`;
    }
    
    if (inches > 0 || fractionalInches > 0) {
      result += '"';
    }
    
    return result || '0"';
  };

  // Format user input for display (only when needed)
  const formatForDisplay = (str, forceFormat = false) => {
    if (!str) return '';
    
    if (!forceFormat && isTyping) {
      // While typing, show raw input
      return str;
    }
    
    str = str.trim();
    
    // If it contains dash, format it
    if (str.includes('-')) {
      const parts = str.split('-');
      const feet = parts[0];
      const inchesPart = parts[1] || '';
      
      if (inchesPart) {
        const inchParts = inchesPart.trim().split(' ');
        let result = `${feet}'`;
        
        if (inchParts[0]) {
          result += `-${inchParts[0]}`;
        }
        
        if (inchParts[1]) {
          result += ` ${inchParts[1]}`;
        }
        
        return result + '"';
      }
      return `${feet}'`;
    }
    
    // If it's just a number
    const num = parseFloat(str);
    if (!isNaN(num)) {
      // Show as inches
      return `${num}"`;
    }
    
    return str;
  };

  // Get closest fraction
  const getClosestFraction = (decimal) => {
    const fractions = [
      [0, ''],
      [0.0625, '1/16'],
      [0.125, '1/8'],
      [0.1875, '3/16'],
      [0.25, '1/4'],
      [0.3125, '5/16'],
      [0.375, '3/8'],
      [0.4375, '7/16'],
      [0.5, '1/2'],
      [0.5625, '9/16'],
      [0.625, '5/8'],
      [0.6875, '11/16'],
      [0.75, '3/4'],
      [0.8125, '13/16'],
      [0.875, '7/8'],
      [0.9375, '15/16'],
    ];
    
    let closest = fractions[0];
    for (const [value, fraction] of fractions) {
      if (Math.abs(decimal - value) < Math.abs(decimal - closest[0])) {
        closest = [value, fraction];
      }
    }
    
    return closest[1];
  };

  // Initialize
  useEffect(() => {
    if (value !== undefined && value !== null && !isTyping) {
      if (showDecimal) {
        // Show as inches in decimal mode
        const inches = value * 12;
        setDisplayValue(isNaN(inches) ? '' : inches.toFixed(3));
        setInputValue(isNaN(inches) ? '' : inches.toFixed(3));
      } else {
        const formatted = formatDecimalToImperial(value);
        setDisplayValue(formatted);
        setInputValue(formatted);
      }
    }
  }, [value, showDecimal]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setDisplayValue(newValue); // Show raw input while typing
    setIsTyping(true);
    
    // Only parse for calculation, don't format yet
    const decimalFeet = parseImperialToDecimal(newValue);
    if (onChange) {
      onChange(decimalFeet);
    }
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    
    if (showDecimal) {
      // Switching from decimal to imperial
      const inches = parseFloat(inputValue) || 0;
      const feet = inches / 12;
      const formatted = formatDecimalToImperial(feet);
      setDisplayValue(formatted);
      setInputValue(formatted);
    } else {
      // Switching from imperial to decimal
      const decimalFeet = parseImperialToDecimal(inputValue);
      const inches = decimalFeet * 12;
      setDisplayValue(inches.toFixed(3));
      setInputValue(inches.toFixed(3));
    }
    
    setShowDecimal(!showDecimal);
    setIsTyping(false);
  };

  const handleFocus = () => {
    setIsTyping(true);
    if (inputRef.current) {
      // Store the current value for potential undo
      lastProcessedValue.current = inputValue;
    }
  };

  const handleBlur = () => {
    setIsTyping(false);
    
    if (inputRef.current && inputValue.trim()) {
      if (showDecimal) {
        // Format decimal value
        const num = parseFloat(inputValue);
        if (!isNaN(num)) {
          const formatted = num.toFixed(3);
          setDisplayValue(formatted);
          setInputValue(formatted);
        }
      } else {
        // Format imperial value on blur
        const formatted = formatForDisplay(inputValue, true);
        setDisplayValue(formatted);
        setInputValue(formatted);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      if (!showDecimal) {
        // In imperial mode, Tab formats the input
        const formatted = formatForDisplay(inputValue, true);
        setDisplayValue(formatted);
        setInputValue(formatted);
      }
      
      // Toggle mode if needed
      if (e.shiftKey) {
        setShowDecimal(!showDecimal);
      }
      
      setIsTyping(false);
    }
    
    if (e.key === 'Enter') {
      setIsTyping(false);
      handleBlur();
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                // Toggle without interrupting typing
                setShowDecimal(!showDecimal);
                setIsTyping(false);
              }}
              className={`p-1 rounded text-xs font-medium ${
                showDecimal 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}
              title={showDecimal ? "Show Imperial" : "Show Decimal"}
            >
              {showDecimal ? 'in' : 'ft-in'}
            </button>
            <button
              type="button"
              onMouseEnter={() => setShowHelp(true)}
              onMouseLeave={() => setShowHelp(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onContextMenu={handleRightClick}
          placeholder={showDecimal ? "0.000" : placeholder}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                   outline-none transition-all font-mono"
          {...props}
        />
        
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {showDecimal ? (
            <Calculator className="w-5 h-5 text-blue-600" />
          ) : (
            <Ruler className="w-5 h-5 text-green-600" />
          )}
        </div>
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
          {showDecimal ? 'in' : ''}
        </div>
      </div>
      
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl"
          >
            <div className="font-medium mb-2">How to use:</div>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Type freely:</strong> Type <code className="bg-gray-800 px-1">11-2 1/2</code> without interruption</li>
              <li>• <strong>Press Tab:</strong> Formats to <code className="bg-gray-800 px-1">11'-2 1/2"</code></li>
              <li>• <strong>Right-click:</strong> Toggles between views</li>
              <li>• <strong>Type 11:</strong> Shows as <code className="bg-gray-800 px-1">11"</code></li>
              <li>• <strong>Click outside:</strong> Auto-formats input</li>
            </ul>
            <div className="mt-3 pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-300 font-medium mb-1">Examples:</div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>• 11-2 1/2 → 11'-2 1/2"</div>
                <div>• 11-2 → 11'-2"</div>
                <div>• 11 → 11"</div>
                <div>• 5 → 5"</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImperialInput;