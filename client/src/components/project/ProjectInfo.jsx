import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config/api';

const initialData = {
  customerName: '', projectName: '', projectNumber: '', projectLocation: '',
  architect: '', eor: '', gcName: '', detailer: '', vendorName: '',
  aiscCertified: 'Yes', units: 'Imperial',
};

export default function ProjectInfo() {
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem('steelProjectInfo');
    return saved ? JSON.parse(saved) : initialData;
  });
  const [saved, setSaved] = useState(false);
  const [dbProjects, setDbProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  // Fetch past projects from DB
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const token = localStorage.getItem('steel_token');
        if (!token) return;
        
        const res = await fetch(`${API_BASE_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.projects) {
          setDbProjects(data.projects);
        }
      } catch (e) {
        console.error('Failed to load DB projects', e);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // Auto-save form changes to localStorage
  useEffect(() => {
    localStorage.setItem('steelProjectInfo', JSON.stringify(form));
  }, [form]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('steel_token');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/projects/upsert`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...form,
          _id: selectedId // Include ID if we are editing an existing project
        })
      });

      const data = await res.json();
      if (data.success) {
        setSaved(true);
        if (data.projectId) setSelectedId(data.projectId);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error('Save failed', e);
    }
  };

  const handleLoadProject = (e) => {
    const projId = typeof e === 'string' ? e : e.target.value;
    if (!projId) return;

    const proj = dbProjects.find(p => p._id === projId);
    if (proj) {
      setSelectedId(proj._id);
      const updatedForm = {
        customerName: proj.customerName || '',
        projectName: proj.projectName || '',
        projectNumber: proj.projectNumber || '',
        projectLocation: proj.projectLocation || '',
        architect: proj.architect || '',
        eor: proj.eor || '',
        gcName: proj.gcName || '',
        detailer: proj.detailer || '',
        vendorName: proj.vendorName || '',
        aiscCertified: proj.aiscCertified || 'Yes',
        units: proj.units || 'Imperial',
        notes: proj.notes || ''
      };
      setForm(updatedForm);
      localStorage.setItem('steelProjectInfo', JSON.stringify(updatedForm));
    }
  };

  const filteredDBProjects = dbProjects.filter(p => 
    p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.projectNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Project Information</h1>
            <p className="page-subtitle">Enter project details and configuration settings</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {saved && (
              <span className="info-chip chip-green">✓ Saved to Cloud</span>
            )}
            <button
              className="header-btn header-btn-primary"
              onClick={handleSave}
              id="save-project-info"
            >
              💾 Save Project Info
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        
        {/* ── Search & Quick Load ───────────────────────────────────── */}
        <div className="eng-card" style={{ borderLeft: '4px solid var(--color-primary-500)' }}>
          <div className="eng-card-body" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
               <div style={{ flex: 1, position: 'relative' }}>
                  <label className="form-label" style={{ marginBottom: '6px' }}>Search & Load Previous Project</label>
                  <input 
                    type="text" 
                    className="form-input data-type-string" 
                    placeholder="Type project name or number to filter..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && filteredDBProjects.length > 0 && (
                    <div style={{ 
                      position: 'absolute', top: '100%', left: 0, right: 0, 
                      background: 'white', border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--radius-md)', zIndex: 100, marginTop: '4px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', maxH: '200px', overflowY: 'auto'
                    }}>
                      {filteredDBProjects.map(p => (
                        <div 
                          key={p._id} 
                          onClick={() => { handleLoadProject(p._id); setSearchQuery(''); }}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.projectName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.projectNumber || 'No Number'} • {p.customerName || 'No Customer'}</div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
               
               <div style={{ width: '240px' }}>
                  <label className="form-label" style={{ marginBottom: '6px' }}>Quick Select</label>
                  <select 
                    onChange={handleLoadProject} 
                    className="form-select data-type-string" 
                    value={selectedId || ""}
                  >
                    <option value="" disabled>☁ Select project...</option>
                    {dbProjects.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.projectName}
                      </option>
                    ))}
                  </select>
               </div>
            </div>
          </div>
        </div>

        {/* ── Project Parties ──────────────────────────────────────── */}
        <div className="eng-card">
          <div className="eng-card-header">
            <span className="eng-card-title">👤 Project Parties</span>
          </div>
          <div className="eng-card-body">
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label className="form-label">Customer Name <span className="data-badge dt-string">STRING</span></label>
                <input
                  className="form-input data-type-string"
                  id="field-customerName"
                  value={form.customerName}
                  onChange={e => set('customerName', e.target.value)}
                  placeholder="e.g. ABC Corp"
                />
              </div>
              <div className="form-field">
                <label className="form-label">
                  Project Name <span className="required">*</span> <span className="data-badge dt-string">STRING</span>
                </label>
                <input
                  className="form-input data-type-string"
                  id="field-projectName"
                  value={form.projectName}
                  onChange={e => set('projectName', e.target.value)}
                  placeholder="e.g. Downtown Office Complex"
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label">Project Number <span className="data-badge dt-string">STRING</span></label>
                <input
                  className="form-input data-type-string"
                  id="field-projectNumber"
                  value={form.projectNumber}
                  onChange={e => set('projectNumber', e.target.value)}
                  placeholder="e.g. PRJ-2024-001"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Project Location <span className="data-badge dt-string">STRING</span></label>
                <input
                  className="form-input data-type-string"
                  id="field-projectLocation"
                  value={form.projectLocation}
                  onChange={e => set('projectLocation', e.target.value)}
                  placeholder="City, State"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Engineering Team ──────────────────────────────────────── */}
        <div className="eng-card">
          <div className="eng-card-header">
            <span className="eng-card-title">🏗 Engineering Team</span>
          </div>
          <div className="eng-card-body">
            <div className="form-grid form-grid-3">
              <div className="form-field">
                <label className="form-label">Architect <span className="data-badge dt-string">STRING</span></label>
                <input
                  className="form-input data-type-string"
                  id="field-architect"
                  value={form.architect}
                  onChange={e => set('architect', e.target.value)}
                  placeholder="Architect name or firm"
                />
              </div>
              <div className="form-field">
                <label className="form-label">EOR (Engineer of Record) <span className="data-badge dt-string">STRING</span></label>
                <input
                  className="form-input data-type-string"
                  id="field-eor"
                  value={form.eor}
                  onChange={e => set('eor', e.target.value)}
                  placeholder="EOR name or firm"
                />
              </div>
              <div className="form-field">
                <label className="form-label">G.C. Name <span className="data-badge dt-string">STRING</span></label>
                <input
                  className="form-input data-type-string"
                  id="field-gcName"
                  value={form.gcName}
                  onChange={e => set('gcName', e.target.value)}
                  placeholder="General Contractor"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Detailer <span className="data-badge dt-string">STRING</span></label>
                <input
                  className="form-input data-type-string"
                  id="field-detailer"
                  value={form.detailer}
                  onChange={e => set('detailer', e.target.value)}
                  placeholder="Detailer name or firm"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Vendor Name <span className="data-badge dt-string">STRING</span></label>
                <input
                  className="form-input data-type-string"
                  id="field-vendorName"
                  value={form.vendorName}
                  onChange={e => set('vendorName', e.target.value)}
                  placeholder="Fabricator / Vendor"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Project Configuration ──────────────────────────────────── */}
        <div className="eng-card">
          <div className="eng-card-header">
            <span className="eng-card-title">⚙️ Project Configuration</span>
          </div>
          <div className="eng-card-body">
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label className="form-label">AISC Certified</label>
                <div className="radio-group" id="toggle-aisc">
                  {['Yes', 'No'].map(v => (
                    <div
                      key={v}
                      className={`radio-option ${form.aiscCertified === v ? 'selected' : ''}`}
                      onClick={() => set('aiscCertified', v)}
                    >
                      {v === 'Yes' ? '✓' : '✕'} {v}
                    </div>
                  ))}
                </div>
                <span className="form-hint">AISC 207 Certification status for this project</span>
              </div>
              <div className="form-field">
                <label className="form-label">Units System</label>
                <div className="radio-group" id="toggle-units">
                  {['Imperial', 'Metric'].map(v => (
                    <div
                      key={v}
                      className={`radio-option ${form.units === v ? 'selected' : ''}`}
                      onClick={() => set('units', v)}
                    >
                      {v === 'Imperial' ? '🇺🇸' : '📏'} {v}
                    </div>
                  ))}
                </div>
                <span className="form-hint">
                  {form.units === 'Imperial' ? 'Feet / Inches / Pounds' : 'Meters / Millimeters / Kilograms'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Summary Card ──────────────────────────────────────────── */}
        {form.projectName && (
          <div className="eng-card fade-in" style={{ borderColor: 'var(--color-primary-200)', background: 'var(--color-primary-50)' }}>
            <div className="eng-card-body">
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-primary-600)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary-700)' }}>{form.projectName}</div>
                </div>
                {form.projectNumber && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-primary-600)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project No.</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary-700)' }}>{form.projectNumber}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-primary-600)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Units</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary-700)' }}>{form.units}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-primary-600)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AISC</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: form.aiscCertified === 'Yes' ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {form.aiscCertified}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
