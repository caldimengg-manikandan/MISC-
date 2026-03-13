import React, { useState, useEffect } from 'react';
import { inchesToFeetInchesFraction, parseArchitecturalInput } from '../../utils/conversionUtils';

const ArchitecturalInput = ({ 
  value, 
  onChange, 
  className, 
  placeholder,
  onFocus,
  onBlur
}) => {
  const [localValue, setLocalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Sync with prop when not focused
  useEffect(() => {
    if (!isFocused) {
       if (value !== null && value !== undefined && !isNaN(value) && value !== 0) {
           setLocalValue(inchesToFeetInchesFraction(value));
       } else if (value === 0) {
           setLocalValue('');
       }
    }
  }, [value, isFocused]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);

    const parsed = parseArchitecturalInput(val);
    
    // If parsed is a valid number, update parent
    if (parsed !== "" && !isNaN(parsed)) {
        onChange(parsed);
    } else {
        // If incomplete or invalid, we might want to set it to 0 or keep previous?
        // StairVisualization2D sets to 0 for incomplete patterns.
        // Let's set to 0 to be safe and consistent, 
        // but checking if it's just empty string is important.
        if (val === '') {
            onChange(0);
        } else {
            // For partial inputs like "11-", parseArchitecturalInput returns "".
            // We can send 0 to parent, or just not update.
            // If we send 0, the cost becomes 0.
            // Let's send 0.
             onChange(0);
        }
    }
  };

  const handleInputFocus = (e) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
  };

  const handleInputBlur = (e) => {
      setIsFocused(false);
      // Re-format on blur
      if (value !== null && !isNaN(value) && value !== 0) {
          setLocalValue(inchesToFeetInchesFraction(value));
      } else {
          setLocalValue('');
      }
      if (onBlur) onBlur(e);
  };

  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      onFocus={handleInputFocus}
      onBlur={handleInputBlur}
      className={className}
      placeholder={placeholder}
    />
  );
};

export default ArchitecturalInput;
