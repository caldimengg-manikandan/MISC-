// client/src/components/common/SearchableSelect.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './SearchableSelect.css';

/**
 * A premium searchable dropdown component.
 * @param {Array} options - List of objects to select from.
 * @param {string} valueKey - Key for the unique ID (e.g., 'id').
 * @param {string} displayKey - Key for the label to display (e.g., 'companyName').
 * @param {string} placeholder - Placeholder text.
 * @param {any} value - Currently selected value (valueKey).
 * @param {function} onSelect - Callback when an item is selected.
 * @param {boolean} loading - Shows a loading state.
 * @param {ReactNode} footer - Optional footer element (e.g., "+ Add New").
 */
const SearchableSelect = ({
  options = [],
  valueKey = 'id',
  displayKey = 'label',
  placeholder = 'Select option...',
  value,
  onSelect,
  loading = false,
  footer = null,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedItem = useMemo(() => 
    options.find(opt => String(opt[valueKey]) === String(value)), 
  [options, value, valueKey]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(opt => 
      String(opt[displayKey]).toLowerCase().includes(term) ||
      (opt.contactPerson && String(opt.contactPerson).toLowerCase().includes(term))
    );
  }, [options, searchTerm, displayKey]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSelect = (option) => {
    onSelect(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`ss-wrapper ${className}`} ref={wrapperRef} style={{ zIndex: isOpen ? 100 : 1 }}>
      <div 
        className={`ss-trigger ${isOpen ? 'ss-trigger-open' : ''} ${selectedItem ? 'ss-has-value' : ''}`}
        onClick={handleToggle}
      >
        <div className="ss-selected-content">
          {selectedItem ? (
            <div className="ss-val-wrap">
              <span className="ss-val-text">{selectedItem[displayKey]}</span>
              {selectedItem.status === 'inactive' && <span className="ss-inactive-badge">Inactive</span>}
            </div>
          ) : (
            <span className="ss-placeholder">{placeholder}</span>
          )}
        </div>
        <div className="ss-actions">
          {value && !isOpen && (
            <button 
              className="ss-clear" 
              onClick={(e) => { e.stopPropagation(); onSelect(null); }}
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={14} className={`ss-chevron ${isOpen ? 'ss-chevron-active' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="ss-dropdown"
            initial={{ opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className="ss-search-box">
              <Search size={14} className="ss-search-icon" />
              <input 
                ref={inputRef}
                type="text" 
                className="ss-search-input"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="ss-results">
              {loading ? (
                <div className="ss-message">Loading options...</div>
              ) : filteredOptions.length === 0 ? (
                <div className="ss-message">No results found.</div>
              ) : (
                filteredOptions.map((opt) => (
                  <div 
                    key={opt[valueKey]} 
                    className={`ss-option ${String(opt[valueKey]) === String(value) ? 'ss-option-selected' : ''}`}
                    onClick={() => handleSelect(opt)}
                  >
                    <div className="ss-opt-main">
                      <span className="ss-opt-label">{opt[displayKey]}</span>
                      {opt.contactPerson && (
                        <span className="ss-opt-sub">
                          <User size={10} style={{ marginRight: 4 }} />
                          {opt.contactPerson}
                        </span>
                      )}
                    </div>
                    {String(opt[valueKey]) === String(value) && <div className="ss-check">✓</div>}
                  </div>
                ))
              )}
            </div>

            {footer && (
              <div className="ss-footer">
                {footer}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchableSelect;

