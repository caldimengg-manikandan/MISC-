import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, X, Save, Edit2, Check, ExternalLink, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';

export default function QuickManageModal({ isOpen, onClose, category, categoryLabel, onUpdate, triggerRect, defaultOptions = [], userRole }) {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [steelLbsLf, setSteelLbsLf] = useState('');
  const [shopLaborMhLf, setShopLaborMhLf] = useState('');
  const [fieldLaborMhLf, setFieldLaborMhLf] = useState('');
  const [description, setDescription] = useState('');
  const [widthMin, setWidthMin] = useState('');
  const [widthMax, setWidthMax] = useState('');
  const [spanMin, setSpanMin] = useState('');
  const [spanMax, setSpanMax] = useState('');
  const [shopEfficiency, setShopEfficiency] = useState('');
  const [fieldEfficiency, setFieldEfficiency] = useState('');
  const [price, setPrice] = useState('');
  const [supportType, setSupportType] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ label: '', value: '', steelLbsLf: '', shopLaborMhLf: '', fieldLaborMhLf: '', description: '', widthMin: '', widthMax: '', spanMin: '', spanMax: '', shopEfficiency: '', fieldEfficiency: '', price: '' });
  const [customCols, setCustomCols] = useState([]); // Dynamic columns
  const [customFields, setCustomFields] = useState({}); // Form state for custom fields
  const [systemConfig, setSystemConfig] = useState({});

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('steel_token');
      fetch(`${API_BASE_URL}/api/v1/admin/config`, { 
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            // Backend returns { success: true, data: { key: value } }
            setSystemConfig(data.data || {});
          }
        })
        .catch(err => console.error('Failed to fetch system config:', err));
    }
  }, [isOpen]);

  const hasBenchmarkFields = category && (
    category.toLowerCase().includes('rail_type') || 
    category === 'stair_type' || 
    category === 'platform_type' || 
    category === 'grating_type' ||
    category === 'material_type' ||
    category === 'gauge_plate_spec' ||
    category.includes('steel_grade')
  );
  
  const getGridColumns = () => {
    const baseCols = 2; // S.No + Description/Label
    const actionCol = 1;
    let extraCols = 0;

    if (category === 'stringer_size') extraCols = 9; // widthMin, widthMax, spanMin, spanMax, weight, shopHrs, fieldHrs, shopEff, fieldEff
    else if (category === 'platform_type') extraCols = 5;
    else if (category === 'material_type') extraCols = 1; // Just price
    else if (category === 'gauge_plate_spec') extraCols = 2; // Weight + Price
    else if (hasBenchmarkFields) extraCols = 4;
    
    // Add custom columns
    const totalCols = baseCols + extraCols + customCols.length + actionCol;
    
    // Construct grid template
    let template = '45px 140px'; // S.No + Description/Label
    if (category === 'stringer_size') {
      template = '45px 250px repeat(9, 100px) 80px';
      return template;
    }
    if (category === 'pan_plate_config') {
      template = '45px 250px repeat(10, 100px) 80px';
      return template;
    }
    for (let i = 0; i < extraCols; i++) template += ' 90px';
    for (let i = 0; i < customCols.length; i++) template += ' 80px';
    template += ' 80px'; // Actions
    
    return template;
  };
  const gridColumns = getGridColumns();
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
  const [dragPos, setDragPos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const resizeStartOffset = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Calculate position based on triggerRect or remembered dragPos
  const getModalStyle = () => {
    // 1. If we have a dragged position, use it
    if (dragPos) {
      return { 
        position: 'fixed', 
        top: `${dragPos.y}px`, 
        left: `${dragPos.x}px`, 
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        margin: 0,
        transform: 'none'
      };
    }

    // 2. Default: Center of screen
    return { 
      position: 'fixed', 
      top: '50%', 
      left: '50%', 
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      transform: 'translate(-50%, -50%)',
      margin: 0 
    };
  };

  const onMouseDown = (e) => {
    // Only drag from header, not from close button
    if (e.target.closest('.close-btn')) return;
    
    const rect = e.currentTarget.closest('.quick-modal').getBoundingClientRect();
    dragStartOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    setIsDragging(true);
  };

  const onResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStartOffset.current = {
      x: e.clientX,
      y: e.clientY,
      w: dimensions.width,
      h: dimensions.height
    };
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e) => {
      if (isDragging) {
        const newPos = {
          x: e.clientX - dragStartOffset.current.x,
          y: e.clientY - dragStartOffset.current.y
        };
        // Boundaries
        newPos.x = Math.max(0, Math.min(newPos.x, window.innerWidth - 100));
        newPos.y = Math.max(0, Math.min(newPos.y, window.innerHeight - 100));
        setDragPos(newPos);
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStartOffset.current.x;
        const deltaY = e.clientY - resizeStartOffset.current.y;
        setDimensions({
          width: Math.max(600, resizeStartOffset.current.w + deltaX),
          height: Math.max(400, resizeStartOffset.current.h + deltaY)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dimensions]);

  const modalStyle = getModalStyle();

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/v1/dictionary/${category}?all=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        console.log(`[QuickManage] Fetched ${data.data?.length} entries for ${category}:`, data.data);
        setEntries(data.data || []);
      }
    } catch (e) {
      toast.error('Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  const fetchColumns = async () => {
    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/v1/library/${category}/columns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCustomCols(data.columns || []);
        // Initialize custom fields state
        const initialFields = {};
        (data.columns || []).forEach(c => { initialFields[c.key] = ''; });
        setCustomFields(initialFields);
      }
    } catch (e) {
      console.error('Failed to load custom columns');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEntries();
      fetchColumns();
    }
  }, [isOpen, category]);

  // Merge database entries with defaults
  const dbLabels = new Set(entries.map(e => (e.label || '').toLowerCase()));
  const mergedDefaults = defaultOptions
    .filter(opt => !dbLabels.has((opt.label || opt.value || opt).toString().toLowerCase()))
    .map(opt => ({
      label: opt.label || opt.value || opt,
      value: opt.value || opt.label || opt,
      isDefault: true
    }));

  const allEntries = [...entries, ...mergedDefaults];
  const showDefaults = entries.length === 0 && defaultOptions.length > 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newLabel) return toast.error('Enter a Display Name');
    
    // Auto-generate value from label
    const autoValue = newLabel.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/v1/dictionary`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          label: newLabel,
          value: supportType || autoValue,
          order: entries.length + defaultOptions.length + 1,
          steelLbsLf: (hasBenchmarkFields || category === 'stringer_size') ? parseFloat(steelLbsLf) || 0 : null,
          shopLaborMhLf: (hasBenchmarkFields || category === 'stringer_size') ? parseFloat(shopLaborMhLf) || 0 : null,
          fieldLaborMhLf: (hasBenchmarkFields || category === 'stringer_size') ? parseFloat(fieldLaborMhLf) || 0 : null,
          description: (category === 'platform_type' || category === 'pan_plate_config') ? description : null,
          widthMin: (category === 'stringer_size' || category === 'pan_plate_config') && widthMin !== '' ? parseFloat(widthMin) : null,
          widthMax: category === 'stringer_size' && widthMax !== '' ? parseFloat(widthMax) : null,
          spanMin: (category === 'stringer_size' || category === 'pan_plate_config') && spanMin !== '' ? parseFloat(spanMin) : null,
          spanMax: (category === 'stringer_size' || category === 'pan_plate_config') && spanMax !== '' ? parseFloat(spanMax) : null,
          shopEfficiency: (category === 'stringer_size' || category === 'pan_plate_config') && shopEfficiency !== '' ? parseFloat(shopEfficiency) : null,
          fieldEfficiency: (category === 'stringer_size' || category === 'pan_plate_config') && fieldEfficiency !== '' ? parseFloat(fieldEfficiency) : null,
          price: price !== '' ? parseFloat(price) : null,
          custom_fields: Object.keys(customFields).length > 0 ? customFields : null
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Added successfully');
        setNewLabel('');
        setSteelLbsLf('');
        setShopLaborMhLf('');
        setFieldLaborMhLf('');
        setDescription('');
        setWidthMin('');
        setWidthMax('');
        setSpanMin('');
        setSpanMax('');
        setShopEfficiency('');
        setFieldEfficiency('');
        setPrice('');
        setSupportType('');
        // Clear custom fields
        const clearedFields = {};
        customCols.forEach(c => { clearedFields[c.key] = ''; });
        setCustomFields(clearedFields);
        fetchEntries();
        if (onUpdate) onUpdate();
      } else {
        toast.error(data.message || 'Error adding option');
      }
    } catch (e) {
      toast.error('Connection error');
    }
  };

  const handleDelete = async (id, entry) => {
    if (!window.confirm('Delete this option?')) return;
    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/v1/dictionary/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Deleted');
        fetchEntries();
        if (onUpdate) onUpdate();
      } else {
        toast.error(data.message || 'Delete failed — this entry may be a system default.');
      }
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const handleEditClick = (entry) => {
    setEditingId(entry.id || entry._id);
    setEditForm({
      label: entry.label || '',
      steelLbsLf: entry.steelLbsLf || '',
      shopLaborMhLf: entry.shopLaborMhLf || '',
      fieldLaborMhLf: entry.fieldLaborMhLf || '',
      description: entry.description || '',
      value: entry.value || '',
      widthMin: entry.widthMin ?? '',
      widthMax: entry.widthMax ?? '',
      spanMin: entry.spanMin ?? '',
      spanMax: entry.spanMax ?? '',
      shopEfficiency: entry.shopEfficiency ?? '',
      fieldEfficiency: entry.fieldEfficiency ?? '',
      price: entry.price || '',
      custom_fields: entry.custom_fields || {}
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id) => {
    if (!editForm.label) return toast.error('Label is required');
    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/v1/dictionary/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editForm,
          widthMin: editForm.widthMin !== '' ? parseFloat(editForm.widthMin) : null,
          widthMax: editForm.widthMax !== '' ? parseFloat(editForm.widthMax) : null,
          spanMin: editForm.spanMin !== '' ? parseFloat(editForm.spanMin) : null,
          spanMax: editForm.spanMax !== '' ? parseFloat(editForm.spanMax) : null,
          shopEfficiency: editForm.shopEfficiency !== '' ? parseFloat(editForm.shopEfficiency) : null,
          fieldEfficiency: editForm.fieldEfficiency !== '' ? parseFloat(editForm.fieldEfficiency) : null,
          category,
          value: editForm.label.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-'),
          price: editForm.price !== '' ? parseFloat(editForm.price) : null,
          custom_fields: editForm.custom_fields || null,
          isActive: true
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Updated successfully');
        setEditingId(null);
        fetchEntries();
        if (onUpdate) onUpdate();
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch (e) {
      toast.error('Update failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="quick-modal-overlay">
      <div className="quick-modal" style={modalStyle} onClick={e => e.stopPropagation()}>
        <div className="quick-modal-header" onMouseDown={onMouseDown} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
          <h3>Manage {categoryLabel}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            {/* Library Hub shortcut — visible only to admin/owner roles */}
            {(userRole === 'admin' || userRole === 'owner' || userRole === 'superadmin') && (
              <button
                onClick={() => { onClose(); navigate(`/library/${category}`); }}
                title="Open full Library Hub for bulk edits, Excel import/export"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                  background: 'rgba(16,163,127,0.1)', border: '1px solid rgba(16,163,127,0.3)',
                  borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  color: '#10a37f', transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
              >
                <ExternalLink size={11} /> Library Hub
              </button>
            )}
            <button onClick={onClose} className="close-btn"><X size={18} /></button>
          </div>
        </div>
        
        <div className="quick-modal-body" style={{ height: 'calc(100% - 50px)', display: 'flex', flexDirection: 'column' }}>
          <form onSubmit={handleAdd} className="quick-add-form">
            <input 
              className="form-input"
              style={{ gridColumn: hasBenchmarkFields ? (category === 'stringer_size' ? 'span 2' : 'span 2') : 'span 2' }}
              placeholder={category === 'stringer_size' ? "Enter Stringer Size" : category === 'gauge_plate_spec' ? "Enter Gauge (e.g. 10 ga)" : "Enter New Option (Display Name)"}
              value={newLabel} 
              onChange={e => setNewLabel(e.target.value)}
              autoFocus
            />
            
            {hasBenchmarkFields && (
              <>
                {(category !== 'material_type') && (
                  <input 
                    type="number" step="0.001"
                    placeholder={category === 'gauge_plate_spec' ? "LBS/SQFT" : "STEEL LBS"} 
                    value={steelLbsLf} 
                    onChange={e => setSteelLbsLf(e.target.value)}
                    className="form-input"
                    title="Steel Weight"
                    style={{ color: '#10a37f', fontWeight: 700 }}
                  />
                )}
                {(category !== 'material_type' && category !== 'gauge_plate_spec') && (
                  <>
                    <input 
                      type="number" step="0.001"
                      placeholder="SHOP HOURS" 
                      value={shopLaborMhLf} 
                      onChange={e => setShopLaborMhLf(e.target.value)}
                      className="form-input"
                      title="Shop Labor (MH/LF)"
                      style={{ color: '#10a37f', fontWeight: 700 }}
                    />
                    <input 
                      type="number" step="0.001"
                      placeholder="FIELD HOURS" 
                      value={fieldLaborMhLf} 
                      onChange={e => setFieldLaborMhLf(e.target.value)}
                      className="form-input"
                      title="Field Labor (MH/LF)"
                      style={{ color: '#10a37f', fontWeight: 700 }}
                    />
                  </>
                )}
                {category !== 'stringer_size' && category !== 'pan_plate_config' && (
                  <input 
                    type="number" step="0.01"
                    placeholder="PRICE ($)" 
                    value={price} 
                    onChange={e => setPrice(e.target.value)}
                    className="form-input"
                    title="Fixed Unit Price ($)"
                    style={{ color: '#10a37f', fontWeight: 700 }}
                  />
                )}
                {category === 'stringer_size' && (
                  <>
                    <input 
                      type="number" step="0.01"
                      placeholder="MIN WIDTH" 
                      value={widthMin} 
                      onChange={e => setWidthMin(e.target.value)}
                      className="form-input"
                      title="Min Stair Width (ft) for this stringer"
                      style={{ color: '#10a37f', fontWeight: 700 }}
                    />
                    <input 
                      type="number" step="0.01"
                      placeholder="MAX WIDTH" 
                      value={widthMax} 
                      onChange={e => setWidthMax(e.target.value)}
                      className="form-input"
                      title="Max Stair Width (ft) for this stringer"
                      style={{ color: '#10a37f', fontWeight: 700 }}
                    />
                    <input 
                      type="number" step="0.01"
                      placeholder="MIN LENGTH" 
                      value={spanMin} 
                      onChange={e => setSpanMin(e.target.value)}
                      className="form-input"
                      title="Min Stringer Length Span (ft)"
                      style={{ color: '#10a37f', fontWeight: 700 }}
                    />
                    <input 
                      type="number" step="0.01"
                      placeholder="MAX LENGTH" 
                      value={spanMax} 
                      onChange={e => setSpanMax(e.target.value)}
                      className="form-input"
                      title="Max Stringer Length Span (ft)"
                      style={{ color: '#10a37f', fontWeight: 700 }}
                    />
                    <input 
                      type="number" step="0.001"
                      placeholder="WEIGHT" 
                      value={steelLbsLf} 
                      onChange={e => setSteelLbsLf(e.target.value)}
                      className="form-input"
                      title="Weight (LBS/LF)"
                      style={{ color: '#10a37f', fontWeight: 700 }}
                    />
                    <input 
                      type="number" step="0.001"
                      placeholder="SHOP HRS" 
                      value={shopLaborMhLf} 
                      onChange={e => setShopLaborMhLf(e.target.value)}
                      className="form-input"
                      title="Shop Labor (MH/LF)"
                      style={{ color: '#10a37f', fontWeight: 700 }}
                    />
                    <input 
                      type="number" step="0.001"
                      placeholder="FIELD HRS" 
                      value={fieldLaborMhLf} 
                      onChange={e => setFieldLaborMhLf(e.target.value)}
                      className="form-input"
                      title="Field Labor (MH/LF)"
                      style={{ color: '#10a37f', fontWeight: 700 }}
                    />
                    <input 
                      type="number" step="1"
                      placeholder="SHOP EFF. (%)" 
                      value={shopEfficiency} 
                      onChange={e => setShopEfficiency(e.target.value)}
                      className="form-input"
                      title="Shop Efficiency Percentage"
                      style={{ color: '#10a37f', fontWeight: 700 }}
                    />
                    <input 
                      type="number" step="1"
                      placeholder="FIELD EFF. (%)" 
                      value={fieldEfficiency} 
                      onChange={e => setFieldEfficiency(e.target.value)}
                      className="form-input"
                      title="Field Efficiency Percentage"
                      style={{ color: '#10a37f', fontWeight: 700 }}
                    />
                  </>
                )}
                {category === 'pan_plate_config' && (
                  <>
                    <input 
                      placeholder="Pl thk" 
                      value={newLabel} 
                      onChange={e => setNewLabel(e.target.value)}
                      className="form-input"
                      title="Plate Thickness (e.g. 7ga to 24ga)"
                    />
                    <input 
                      placeholder="Pan Type" 
                      value={description} 
                      onChange={e => setDescription(e.target.value)}
                      className="form-input"
                    />
                    <input 
                      placeholder="Pan support type" 
                      value={supportType} 
                      onChange={e => setSupportType(e.target.value)}
                      className="form-input"
                    />
                    <input 
                      type="number" step="0.01"
                      placeholder="Min length" 
                      value={spanMin} 
                      onChange={e => setSpanMin(e.target.value)}
                      className="form-input"
                    />
                    <input 
                      type="number" step="0.01"
                      placeholder="Max length" 
                      value={spanMax} 
                      onChange={e => setSpanMax(e.target.value)}
                      className="form-input"
                    />
                    <input 
                      placeholder="Weight" 
                      value={steelLbsLf} 
                      onChange={e => setSteelLbsLf(e.target.value)}
                      className="form-input"
                    />
                    <input 
                      type="number" step="0.001"
                      placeholder="Shop hrs" 
                      value={shopLaborMhLf} 
                      onChange={e => setShopLaborMhLf(e.target.value)}
                      className="form-input"
                    />
                    <input 
                      type="number" step="0.001"
                      placeholder="Field hrs" 
                      value={fieldLaborMhLf} 
                      onChange={e => setFieldLaborMhLf(e.target.value)}
                      className="form-input"
                    />
                    <input 
                      type="number" step="1"
                      placeholder="shop efficiency %" 
                      value={shopEfficiency} 
                      onChange={e => setShopEfficiency(e.target.value)}
                      className="form-input"
                    />
                    <input 
                      type="number" step="1"
                      placeholder="Field efficiency %" 
                      value={fieldEfficiency} 
                      onChange={e => setFieldEfficiency(e.target.value)}
                      className="form-input"
                    />
                  </>
                )}
                {category === 'platform_type' && (
                  <input 
                    type="number" step="0.001"
                    placeholder="PAN RISER LB/FT" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    className="form-input"
                    title="Pan Riser Weight (LB/FT)"
                    style={{ color: '#10a37f', fontWeight: 700 }}
                  />
                )}
              </>
            )}

            {/* Custom Columns Inputs */}
            {category !== 'pan_plate_config' && customCols.map(col => (
              <input 
                key={col.key}
                className="form-input"
                type={col.type === 'number' ? 'number' : 'text'}
                step={col.type === 'number' ? 'any' : undefined}
                placeholder={col.header.toUpperCase()}
                value={customFields[col.key] || ''}
                onChange={e => setCustomFields({ ...customFields, [col.key]: e.target.value })}
                title={col.header}
                style={{ borderBottom: '2px solid rgba(16,163,127,0.2)' }}
              />
            ))}

            <button type="submit" className="add-btn" style={{ 
              gridColumn: category === 'stringer_size' ? 'span 1' : 'span 1',
              padding: '8px 4px',
              minWidth: '120px'
            }}>
              <Plus size={16} /> Add {categoryLabel.replace(' Types', '')}
            </button>
          </form>

          <div className="quick-entries-list">
            <div className="list-header" style={{ 
              display: 'grid', 
              gridTemplateColumns: gridColumns, 
              padding: '8px 14px', 
              fontSize: '10px',
              position: 'sticky',
              top: 0,
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              zIndex: 10,
              marginBottom: 0
            }}>
              <span>S.No.</span>
              {category !== 'pan_plate_config' && (
                <span>{category === 'stringer_size' ? 'Stringer size' : category === 'gauge_plate_spec' ? 'Gauge' : 'Description'}</span>
              )}
              
              {category === 'stringer_size' && (
                <>
                  <span style={{ textAlign: 'center' }}>Min. Stair width</span>
                  <span style={{ textAlign: 'center' }}>Max stair width</span>
                  <span style={{ textAlign: 'center' }}>Min length</span>
                  <span style={{ textAlign: 'center' }}>Max length</span>
                  <span style={{ textAlign: 'center' }}>Weight (LBS)</span>
                  <span style={{ textAlign: 'center' }}>Shop hrs</span>
                  <span style={{ textAlign: 'center' }}>Field hrs</span>
                  <span style={{ textAlign: 'center' }}>Shop efficiency (%)</span>
                  <span style={{ textAlign: 'center' }}>Field efficiency (%)</span>
                </>
              )}

              {category === 'pan_plate_config' && (
                <>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                    <span>Pl thk</span>
                    <span style={{ fontSize: '0.8em', opacity: 0.7 }}>&nbsp;</span>
                  </div>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                    <span>Pan Type</span>
                    <span style={{ fontSize: '0.8em', opacity: 0.7 }}>&nbsp;</span>
                  </div>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                    <span>Pan support type</span>
                    <span style={{ fontSize: '0.8em', opacity: 0.7 }}>&nbsp;</span>
                  </div>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                    <span>Min length</span>
                    <span style={{ fontSize: '0.8em', opacity: 0.7 }}>FT</span>
                  </div>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                    <span>Max length</span>
                    <span style={{ fontSize: '0.8em', opacity: 0.7 }}>FT</span>
                  </div>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                    <span>Weight</span>
                    <span style={{ fontSize: '0.8em', opacity: 0.7 }}>LBS</span>
                  </div>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                    <span>Shop hrs</span>
                    <span style={{ fontSize: '0.8em', opacity: 0.7 }}>HR</span>
                  </div>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                    <span>Field hrs</span>
                    <span style={{ fontSize: '0.8em', opacity: 0.7 }}>HR</span>
                  </div>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                    <span>shop efficiency %</span>
                    <span style={{ fontSize: '0.8em', opacity: 0.7 }}>%</span>
                  </div>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                    <span>Field efficiency %</span>
                    <span style={{ fontSize: '0.8em', opacity: 0.7 }}>%</span>
                  </div>
                </>
              )}

              {hasBenchmarkFields && (
                <>
                  {(category !== 'material_type') && (
                    <span style={{ textAlign: 'center' }}>
                      {category === 'gauge_plate_spec' ? 'LBS/SQFT' : category === 'platform_type' ? 'LBS/SF' : 'LBS/LF'}
                    </span>
                  )}
                  {(category !== 'material_type' && category !== 'gauge_plate_spec') && (
                    <>
                      <span style={{ textAlign: 'center' }}>SHOP HOURS</span>
                      <span style={{ textAlign: 'center' }}>FIELD HOURS</span>
                    </>
                  )}
                  <span style={{ textAlign: 'center' }}>
                    {category === 'gauge_plate_spec' ? 'PRICE($/SF)' : category === 'material_type' ? 'PRICE($/LB)' : 'PRICE ($)'}
                  </span>
                  {category === 'platform_type' && <span style={{ textAlign: 'center' }}>PAN RISER</span>}
                </>
              )}
              {category !== 'pan_plate_config' && customCols.map(col => (
                <span key={col.key} style={{ textAlign: 'center' }}>{col.header.toUpperCase()}</span>
              ))}
              <span></span>
            </div>
            {loading ? <div className="loading-txt">Loading...</div> : (
              <>
                {allEntries.map((entry, index) => {
                  const isEditing = editingId === (entry.id || entry._id);
                  const isDefault = entry.isDefault || entry.isGlobalDefault;
                  return (
                    <div key={entry.id || entry._id || `idx-${index}`} className={`quick-entry-item ${isEditing ? 'is-editing' : ''} ${isDefault ? 'default-item' : ''}`} style={{ 
                      display: 'grid', 
                      gridTemplateColumns: gridColumns, 
                      fontSize: '12px',
                      alignItems: 'center',
                      opacity: isDefault ? 0.75 : 1,
                      background: entry.isSystemDefault ? 'rgba(245,158,11,0.04)' : undefined,
                      padding: '10px 14px',
                      borderBottom: '1px solid #f1f5f9'
                    }}>
                      <div className="sno" style={{ color: '#10a37f', fontWeight: 700, opacity: 0.8 }}>{index + 1}.</div>
                      
                      {isEditing ? (
                        <>
                          {category !== 'pan_plate_config' && (
                            <input 
                              className="edit-input"
                              value={editForm.label}
                              onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                              autoFocus
                            />
                          )}
                          {hasBenchmarkFields && (
                            <>
                              {(category !== 'material_type') && (
                                <input 
                                  className="edit-input center"
                                  type="number" step="0.001"
                                  value={editForm.steelLbsLf}
                                  onChange={e => setEditForm({ ...editForm, steelLbsLf: e.target.value })}
                                  style={{ color: '#10a37f', fontWeight: 700 }}
                                />
                              )}
                              {(category !== 'material_type' && category !== 'gauge_plate_spec') && (
                                <>
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.001"
                                    value={editForm.shopLaborMhLf}
                                    onChange={e => setEditForm({ ...editForm, shopLaborMhLf: e.target.value })}
                                    style={{ color: '#10a37f', fontWeight: 700 }}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.001"
                                    value={editForm.fieldLaborMhLf}
                                    onChange={e => setEditForm({ ...editForm, fieldLaborMhLf: e.target.value })}
                                    style={{ color: '#10a37f', fontWeight: 700 }}
                                  />
                                </>
                              )}
                              {category !== 'pan_plate_config' && (
                                <input 
                                  className="edit-input center"
                                  type="number" step="0.01"
                                  value={editForm.price}
                                  onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                  style={{ color: '#10a37f', fontWeight: 700 }}
                                />
                              )}
                              {category === 'platform_type' && (
                                <input 
                                  className="edit-input center"
                                  type="number" step="0.001"
                                  value={editForm.description}
                                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                  style={{ color: '#10a37f', fontWeight: 700 }}
                                />
                              )}
                              {category === 'stringer_size' && (
                                <>
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.01"
                                    value={editForm.widthMin}
                                    onChange={e => setEditForm({ ...editForm, widthMin: e.target.value })}
                                    style={{ color: '#10a37f', fontWeight: 700 }}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.01"
                                    value={editForm.widthMax}
                                    onChange={e => setEditForm({ ...editForm, widthMax: e.target.value })}
                                    style={{ color: '#10a37f', fontWeight: 700 }}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.01"
                                    value={editForm.spanMin}
                                    onChange={e => setEditForm({ ...editForm, spanMin: e.target.value })}
                                    style={{ color: '#10a37f', fontWeight: 700 }}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.01"
                                    value={editForm.spanMax}
                                    onChange={e => setEditForm({ ...editForm, spanMax: e.target.value })}
                                    style={{ color: '#10a37f', fontWeight: 700 }}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.001"
                                    value={editForm.steelLbsLf}
                                    onChange={e => setEditForm({ ...editForm, steelLbsLf: e.target.value })}
                                    style={{ color: '#10a37f', fontWeight: 700 }}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.001"
                                    value={editForm.shopLaborMhLf}
                                    onChange={e => setEditForm({ ...editForm, shopLaborMhLf: e.target.value })}
                                    style={{ color: '#10a37f', fontWeight: 700 }}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.001"
                                    value={editForm.fieldLaborMhLf}
                                    onChange={e => setEditForm({ ...editForm, fieldLaborMhLf: e.target.value })}
                                    style={{ color: '#10a37f', fontWeight: 700 }}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="1"
                                    value={editForm.shopEfficiency}
                                    onChange={e => setEditForm({ ...editForm, shopEfficiency: e.target.value })}
                                    style={{ color: '#10a37f', fontWeight: 700 }}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.001"
                                    value={editForm.fieldEfficiency}
                                    onChange={e => setEditForm({ ...editForm, fieldEfficiency: e.target.value })}
                                    style={{ color: '#10a37f', fontWeight: 700 }}
                                  />
                                </>
                              )}
                              {category === 'pan_plate_config' && (
                                <>
                                  <input 
                                    className="edit-input center"
                                    value={editForm.label}
                                    onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                                  />
                                  <input 
                                    className="edit-input center"
                                    value={editForm.description}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                  />
                                  <input 
                                    className="edit-input center"
                                    value={editForm.value}
                                    onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.01"
                                    value={editForm.spanMin}
                                    onChange={e => setEditForm({ ...editForm, spanMin: e.target.value })}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.01"
                                    value={editForm.spanMax}
                                    onChange={e => setEditForm({ ...editForm, spanMax: e.target.value })}
                                  />
                                  <input 
                                    className="edit-input center"
                                    value={editForm.steelLbsLf}
                                    onChange={e => setEditForm({ ...editForm, steelLbsLf: e.target.value })}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.001"
                                    value={editForm.shopLaborMhLf}
                                    onChange={e => setEditForm({ ...editForm, shopLaborMhLf: e.target.value })}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.001"
                                    value={editForm.fieldLaborMhLf}
                                    onChange={e => setEditForm({ ...editForm, fieldLaborMhLf: e.target.value })}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="1"
                                    value={editForm.shopEfficiency}
                                    onChange={e => setEditForm({ ...editForm, shopEfficiency: e.target.value })}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="1"
                                    value={editForm.fieldEfficiency}
                                    onChange={e => setEditForm({ ...editForm, fieldEfficiency: e.target.value })}
                                  />
                                </>
                              )}
                            </>
                          )}

                          {/* Custom Columns Edit Inputs */}
                          {category !== 'pan_plate_config' && customCols.map(col => (
                            <input 
                              key={col.key}
                              className="edit-input center"
                              type={col.type === 'number' ? 'number' : 'text'}
                              step={col.type === 'number' ? 'any' : undefined}
                              value={editForm.custom_fields?.[col.key] || ''}
                              onChange={e => setEditForm({
                                ...editForm,
                                custom_fields: {
                                  ...(editForm.custom_fields || {}),
                                  [col.key]: e.target.value
                                }
                              })}
                            />
                          ))}

                          {!hasBenchmarkFields && customCols.length === 0 && <div></div>}
                        </>
                      ) : (
                        <>
                          {category !== 'pan_plate_config' && (
                            <div className="entry-label" style={{ 
                              fontWeight: 500, 
                              display: 'flex', 
                              flexDirection: 'column', 
                              justifyContent: 'center', 
                              gap: 2, 
                              padding: '4px 0',
                              overflow: 'visible'
                            }}>
                              <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{entry.label}</div>
                              {(category !== 'stringer_size' && category !== 'pan_plate_config' && entry.description && entry.description !== entry.label) && (
                                <div style={{ fontSize: '0.7em', color: '#666', fontWeight: 400, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                  {entry.description}
                                </div>
                              )}
                            </div>
                          )}
                          {category === 'stringer_size' && (
                            <>
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{entry.widthMin !== null && entry.widthMin !== undefined ? entry.widthMin : '—'}</div>
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{entry.widthMax !== null && entry.widthMax !== undefined ? entry.widthMax : '—'}</div>
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{entry.spanMin !== null && entry.spanMin !== undefined ? entry.spanMin : '—'}</div>
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{entry.spanMax !== null && entry.spanMax !== undefined ? entry.spanMax : '—'}</div>
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{entry.steelLbsLf !== null && entry.steelLbsLf !== undefined ? entry.steelLbsLf : '—'}</div>
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{entry.shopLaborMhLf !== null && entry.shopLaborMhLf !== undefined ? entry.shopLaborMhLf : '—'}</div>
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{entry.fieldLaborMhLf !== null && entry.fieldLaborMhLf !== undefined ? entry.fieldLaborMhLf : '—'}</div>
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{entry.shopEfficiency !== null && entry.shopEfficiency !== undefined ? entry.shopEfficiency : '—'}</div>
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{entry.fieldEfficiency !== null && entry.fieldEfficiency !== undefined ? entry.fieldEfficiency : '—'}</div>
                            </>
                          )}
                          {category === 'pan_plate_config' && (
                            <>
                              <div style={{ textAlign: 'center' }}>{entry.label ?? '—'}</div>
                              <div style={{ textAlign: 'center' }}>{entry.description ?? '—'}</div>
                              <div style={{ textAlign: 'center' }}>{entry.value ?? '—'}</div>
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{entry.spanMin ?? '—'}</div>
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{entry.spanMax ?? '—'}</div>
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{(!entry.steelLbsLf || entry.steelLbsLf === 0) ? 'TBD' : entry.steelLbsLf}</div>
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{entry.shopLaborMhLf ?? '—'}</div>
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{entry.fieldLaborMhLf ?? '—'}</div>
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{entry.shopEfficiency ?? '—'}</div>
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{entry.fieldEfficiency ?? '—'}</div>
                            </>
                          )}
                          {hasBenchmarkFields ? (
                            <>
                              {(category !== 'material_type') && (
                                <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>
                                  {entry.steelLbsLf !== null && entry.steelLbsLf !== undefined ? entry.steelLbsLf : '—'}
                                </div>
                              )}
                              {(category !== 'material_type' && category !== 'gauge_plate_spec') && (
                                <>
                                  <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>
                                    {entry.shopLaborMhLf !== null && entry.shopLaborMhLf !== undefined ? entry.shopLaborMhLf : '—'}
                                  </div>
                                  <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>
                                    {entry.fieldLaborMhLf !== null && entry.fieldLaborMhLf !== undefined ? entry.fieldLaborMhLf : '—'}
                                  </div>
                                </>
                              )}
                              <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>
                                {(() => {
                                  if (entry.price != null && entry.price !== 0 && entry.price !== '') {
                                    return `$${parseFloat(entry.price).toFixed(2)}`;
                                  }
                                  
                                  // PRICE ESTIMATION ENGINE FALLBACKS
                                  const isWeightBased = ['guardRail_type', 'wallRail_type', 'grabRail_type', 'caneRail_type', 'stringer_size'].includes(category);
                                  if (isWeightBased) {
                                    const steelLbs = parseFloat(entry.steelLbsLf);
                                    const globalSteelPrice = parseFloat(systemConfig?.steel_price_per_lb || 0.75);
                                    if (steelLbs > 0) return `$${(steelLbs * globalSteelPrice).toFixed(2)}`;
                                  } else if (category === 'finish_option') {
                                    const lbl = (entry.label || '').toLowerCase();
                                    const valCode = (entry.value || '').toLowerCase();
                                    let est = null;
                                    if (lbl.includes('galv') || valCode.includes('galv')) est = systemConfig?.galvanize_charge || systemConfig?.galvanize_rate || 0.75;
                                    else if (lbl.includes('powder') || valCode.includes('powder')) est = systemConfig?.powder_coat_rate || 1.7587;
                                    else if (lbl.includes('primer') || valCode.includes('primer')) est = systemConfig?.primer_rate || 0;
                                    if (est !== null) return `$${parseFloat(est).toFixed(2)}`;
                                  } else if (category === 'mounting_type') {
                                    const lbl = (entry.label || '').toLowerCase();
                                    let est = null;
                                    if (lbl.includes('embedded')) est = systemConfig?.embedded_post_rate || 5.00;
                                    else if (lbl.includes('anchored')) est = (systemConfig?.por_rok_anchor_rate > 0) ? systemConfig?.por_rok_anchor_rate : (systemConfig?.anchored_post_rate || 6.00);
                                    if (est !== null) return `$${parseFloat(est).toFixed(2)}`;
                                  } else if (category === 'platform_type') {
                                    const lbl = (entry.label || '').toLowerCase();
                                    if (lbl.includes('pan')) return `$${parseFloat(systemConfig?.stair_pan_rate || 1.00).toFixed(2)}`;
                                  }
                                  
                                  return '—';
                                })()}
                              </div>
                              {category === 'platform_type' && (
                                <div style={{ textAlign: 'center', color: '#10a37f', fontWeight: 700 }}>{Number(entry.description || 0)}</div>
                              )}
                            </>
                          ) : (
                            !hasBenchmarkFields && category !== 'stringer_size' && customCols.length === 0 ? <div></div> : null
                          )}

                          {/* Custom Columns Read-only View */}
                          {category !== 'pan_plate_config' && customCols.map(col => (
                            <div key={col.key} style={{ textAlign: 'center', opacity: 0.8 }}>
                              {(entry.custom_fields?.[col.key]) || '-'}
                            </div>
                          ))}
                        </>
                      )}
  
                      <div className="entry-actions" style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSaveEdit(entry.id || entry._id)} className="save-edit-btn" title="Save">
                              <Check size={14} />
                            </button>
                            <button onClick={handleCancelEdit} className="cancel-edit-btn" title="Cancel">
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEditClick(entry)} className="edit-btn" title="Edit">
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(entry.id || entry._id, entry)} 
                              className="del-btn" 
                              title="Delete"
                              disabled={!entry.id && !entry._id} // Disable delete only for hardcoded local fallbacks
                              style={{ opacity: (!entry.id && !entry._id) ? 0.3 : 1 }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {showDefaults && defaultOptions.map((opt, idx) => (
                  <div key={`def-${idx}`} className="quick-entry-item default-item">
                    <div className="entry-info">
                      <span className="entry-label">
                        <span style={{ marginRight: '8px', opacity: 0.4, fontSize: '11px', fontWeight: 600 }}>{entries.length + idx + 1}.</span>
                        {opt}
                      </span>
                      <span className="default-badge" style={{ marginLeft: '12px' }}>System Default</span>
                    </div>
                    <div className="del-placeholder" title="System defaults cannot be deleted. Add as custom to manage.">
                      <Trash2 size={14} style={{ opacity: 0.3 }} />
                    </div>
                  </div>
                ))}

                {entries.length === 0 && defaultOptions.length === 0 && (
                  <div className="empty-txt">No custom options found.</div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Resize Handle */}
        <div 
          onMouseDown={onResizeStart}
          style={{ 
            position: 'absolute', bottom: 0, right: 0, width: 15, height: 15, 
            cursor: 'nwse-resize', background: 'transparent', zIndex: 100 
          }} 
        />
      </div>

      <style jsx>{`
        .quick-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.3); z-index: 2100;
        }
        .quick-modal {
          background: white; border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          overflow: hidden; animation: modalPop 0.2s ease-out;
          position: relative;
        }
        @keyframes modalPop {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .quick-modal-header {
          padding: 14px 20px; border-bottom: 1px solid #e2e8f0;
          display: flex; justify-content: space-between; align-items: center;
          background: #f8fafc;
          border-top: 4px solid #10a37f;
        }
        .quick-modal-header h3 { font-size: 15px; font-weight: 700; margin: 0; color: #1e293b; }
        .close-btn { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; }
        .close-btn:hover { color: #ef4444; }
        
        .quick-modal-body { padding: 20px; }
        .quick-add-form { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 20px; }
        .quick-add-form .form-input { padding: 10px 14px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 8px; width: 100%; }
        .quick-add-form .form-input:focus { border-color: var(--color-primary-500); outline: none; box-shadow: 0 0 0 2px var(--color-primary-50); }
        .add-btn { 
          background: var(--color-primary-600); color: white; border: none;
          border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 4px;
          transition: all 0.2s;
        }
        .add-btn:hover { background: var(--color-primary-700); transform: translateY(-1px); shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }

        .list-header { 
          font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; 
          margin-bottom: 8px; letter-spacing: 0.025em; 
          position: sticky; top: 0; background: white; z-index: 10;
          padding: 10px 0; margin-top: -10px;
          border-bottom: 1px solid #f1f5f9;
        }
        .quick-entries-list { flex: 1; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; }
        .quick-entry-item { 
          display: grid; align-items: center;
          padding: 10px 14px; border-bottom: 1px solid #f1f5f9;
        }
        .quick-entry-item:last-child { border-bottom: none; }
        .quick-entry-item:hover { background: #f8fafc; }
        .entry-info { display: flex; flex-direction: column; }
        .entry-label { font-size: 14px; font-weight: 500; color: #334155; }
        .default-badge { font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
        .del-btn { color: #94a3b8; background: none; border: none; cursor: pointer; padding: 6px; transition: all 0.2s; }
        .del-btn:hover { color: #ef4444; background: #fee2e2; border-radius: 6px; }
        .del-placeholder { padding: 6px; cursor: help; }
        .edit-btn { color: #94a3b8; background: none; border: none; cursor: pointer; padding: 6px; transition: all 0.2s; }
        .edit-btn:hover { color: #3b82f6; background: #dbeafe; border-radius: 6px; }
        .save-edit-btn { color: #10b981; background: none; border: none; cursor: pointer; padding: 6px; transition: all 0.2s; }
        .save-edit-btn:hover { background: #d1fae5; border-radius: 6px; }
        .cancel-edit-btn { color: #f43f5e; background: none; border: none; cursor: pointer; padding: 6px; transition: all 0.2s; }
        .cancel-edit-btn:hover { background: #ffe4e6; border-radius: 6px; }
        .edit-input { width: 90%; background: #fff; border: 1px solid #3b82f6; border-radius: 4px; padding: 4px 8px; font-size: 13px; outline: none; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
        .edit-input.center { text-align: center; width: 80%; margin: 0 auto; }
        .quick-entry-item.is-editing { background: #eff6ff; }
        .loading-txt { text-align: center; font-size: 13px; color: #94a3b8; padding: 30px; }
        .empty-txt { text-align: center; font-size: 13px; color: #94a3b8; padding: 30px; }
      `}</style>
    </div>
  );
}

