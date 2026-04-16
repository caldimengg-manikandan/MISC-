import React, { useState, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import EstimationPreviewCard from '../../components/common/EstimationPreviewCard';
import API_BASE_URL from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import QuickManageModal from '../../components/common/QuickManageModal';

const DEFAULT_FINISH_OPTIONS = ['Primer', 'Painted', 'Galvanized', 'Galv+Painted', 'Powder Coated'];

// ── Unit Input Helper (Consistent with StairConfig) ─────────
const UnitInput = ({ id, value, label, onChange, placeholder, hint }) => {
  const { value: val, unit } = value || { value: '', unit: 'FT' };

  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <div className="form-input-with-unit">
        <input
          id={id}
          type="text"
          className="arch-input"
          value={val}
          onChange={e => onChange({ value: e.target.value, unit })}
          onFocus={e => e.target.select()}
          placeholder={placeholder || '0'}
        />
        <button
          type="button"
          className="form-input-unit unit-active"
          style={{ cursor: 'pointer', border: 'none' }}
          onClick={() => onChange({ value: val, unit: unit === 'FT' ? 'IN' : 'FT' })}
        >
          {unit}
        </button>
      </div>
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );
};

export default function KickPlateConfig({ data, onChange, onFocus }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const [dropdowns, setDropdowns] = useState({
    steelGrades: ['A992', 'A572-50', 'A36', 'SS316', 'SS 304'],
    finishes: []
  });

  const [quickModal, setQuickModal] = useState({ isOpen: false, category: '', label: '', rect: null });

  const load = useCallback(async () => {
    const fetchList = async (category) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dictionary/${category}`);
        return (await res.json()).data || [];
      } catch (e) { return []; }
    };

    const [fo, sg] = await Promise.all([
      fetchList('finish_option'),
      fetchList('steel_grade_rail')
    ]);

    setDropdowns({
      finishes: fo.length > 0 ? fo.map(i => i.label) : DEFAULT_FINISH_OPTIONS,
      steelGrades: sg.length > 0 ? sg.map(i => i.label) : ['A992', 'A572-50', 'A36', 'SS316', 'SS 304']
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openManage = (category, label, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setQuickModal({ isOpen: true, category, label, rect });
  };

  const [form, setForm] = useState({
    railLength: data?.railLength || { value: '', unit: 'FT' },
    width: data?.width || data?.widthIn || 4,
    steelGrade: data?.steelGrade || 'A36',
    finish: data?.finish || 'Primer',
    ...data
  });

  useEffect(() => {
    if (data) {
      setForm(f => ({ 
        ...f, 
        ...data,
        width: data.width || data.widthIn || f.width 
      }));
    }
  }, [data]);

  const set = (k, v) => {
    const updated = { ...form, [k]: v };
    // Maintain both field names for compatibility
    if (k === 'width') updated.widthIn = v;
    setForm(updated);
    if (onChange) onChange(updated);
  };

  return (
    <div onPointerDown={onFocus}>
      <div className="form-section">
        <div className="form-section-title">
          Kick Plate Configuration
        </div>

        <div className="kick-specs-grid">
          <UnitInput
            id="kick-length"
            label="Length"
            value={form.railLength}
            onChange={v => set('railLength', v)}
          />

          <div className="form-field">
            <label className="form-label">Width</label>
            <div className="form-input-with-unit">
              <input
                type="number"
                className="form-input"
                value={form.width}
                min="1"
                max="24"
                step="1"
                onChange={e => set('width', e.target.value)}
                onFocus={e => e.target.select()}
                style={{ width: '100% !important' }}
              />
              <span className="form-input-unit">IN</span>
            </div>
            <div className="quick-width-options" style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
               {[3, 4, 6, 8].map(w => (
                 <button 
                  key={w}
                  className={`width-pill ${form.width == w ? 'active' : ''}`}
                  onClick={() => set('width', w)}
                  type="button"
                 >
                   {w}"
                 </button>
               ))}
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">
              Steel Grade
              {isAdmin && (
                <button
                  onClick={(e) => openManage('steel_grade_rail', 'Steel Grades', e)}
                  className="quick-edit-btn"
                  title="Manage Options"
                >
                  <Settings size={14} />
                </button>
              )}
            </label>
            <select
              className="form-select compact-select"
              value={form.steelGrade}
              onChange={e => set('steelGrade', e.target.value)}
            >
              {dropdowns.steelGrades.map(sg => <option key={sg} value={sg}>{sg}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">
              Finish Specification
              {isAdmin && (
                <button
                  onClick={(e) => openManage('finish_option', 'Finish Options', e)}
                  className="quick-edit-btn"
                  title="Manage Options"
                >
                  <Settings size={14} />
                </button>
              )}
            </label>
            <select
              className="form-select compact-select"
              value={form.finish}
              onChange={e => set('finish', e.target.value)}
            >
              <option value="">— Select Finish —</option>
              {dropdowns.finishes.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Real-time Preview ── */}
      {data?.systemCalc && (
        <div className="mt-6">
          <EstimationPreviewCard 
            systemCalc={data.systemCalc} 
            totalCost={data.totalCost} 
            unitType="LF"
            finishName={form.finish}
            hidePricePerRiser={true}
            title="Kick Plate Preview"
          />
        </div>
      )}

      <QuickManageModal
        isOpen={quickModal.isOpen}
        onClose={() => setQuickModal({ ...quickModal, isOpen: false })}
        category={quickModal.category}
        categoryLabel={quickModal.label}
        onUpdate={load}
        triggerRect={quickModal.rect}
        defaultOptions={
          quickModal.category === 'finish_option' ? DEFAULT_FINISH_OPTIONS : ([])
        }
      />

      <style>{`
        .kick-specs-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .mt-6 { margin-top: 24px; }
        .quick-edit-btn { margin-left: 4px; border: none; background: none; cursor: pointer; color: #64748b; }
        .quick-edit-btn:hover { color: #1e293b; }
        
        .width-pill {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .width-pill:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
        .width-pill.active {
          background: var(--accent-blue);
          border-color: var(--accent-blue);
          color: white;
        }
      `}</style>
    </div>
  );
}
