// client/src/components/project/QuickAddCustomerModal.jsx
import React, { useState } from 'react';
import { X, Save, User, Building2, Phone, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const QuickAddCustomerModal = ({ isOpen, onClose, onCustomerAdded }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setFormData(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      toast.error('Company Name is required');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('steel_token');
      const res = await api.post('/customers', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        toast.success('Customer added successfully');
        onCustomerAdded({ id: res.data.id, ...formData });
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add customer');
    } finally {
      setSaving(false);
    }
  };
  
  const MODAL_STYLE = `
    .sc-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20000;
    }
    .sc-modal-panel {
      background: #fff;
      border-radius: 20px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }
    .sc-modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .sc-modal-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }
    .sc-confirm-actions {
      padding: 20px 24px;
      background: #f9fafb;
      border-top: 1px solid #f3f4f6;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .confirm-btn-outline {
      padding: 10px 20px;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      background: white;
      color: #374151;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .confirm-btn-outline:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
    }
    .confirm-btn-solid {
      padding: 10px 20px;
      border-radius: 10px;
      border: none;
      background: #111827;
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .confirm-btn-solid:hover {
      background: #000;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .confirm-btn-solid:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .form-input-with-unit {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .form-input-with-unit .ed-input {
      padding-left: 36px !important;
      width: 100%;
    }
    .form-input-with-unit svg {
      position: absolute;
      left: 12px;
      color: #94a3b8;
      pointer-events: none;
      z-index: 2;
    }
  `;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="sc-modal-backdrop" style={{ zIndex: 20000 }}>
          <motion.div 
            className="sc-modal-panel"
            style={{ maxWidth: '550px' }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
          >
            <div className="sc-modal-header">
              <h2 className="sc-modal-title">Quick Add Customer</h2>
              <button className="icon-btn" onClick={onClose}><X size={16} /></button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="sc-modal-body" style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div className="ed-field">
                    <label className="ed-label">Company Name *</label>
                    <div className="form-input-with-unit">
                      <Building2 size={14} />
                      <input 
                        className="ed-input" 
                        value={formData.companyName}
                        onChange={e => set('companyName', e.target.value)}
                        placeholder="e.g. Acme Corp"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="ed-field">
                    <label className="ed-label">Contact Person</label>
                    <div className="form-input-with-unit">
                      <User size={14} />
                      <input 
                        className="ed-input" 
                        value={formData.contactPerson}
                        onChange={e => set('contactPerson', e.target.value)}
                        placeholder="e.g. John Doe"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="ed-field">
                      <label className="ed-label">Email</label>
                      <div className="form-input-with-unit">
                        <Mail size={14} />
                        <input 
                          type="email"
                          className="ed-input" 
                          value={formData.email}
                          onChange={e => set('email', e.target.value)}
                          placeholder="j.doe@acme.com"
                        />
                      </div>
                    </div>
                    <div className="ed-field">
                      <label className="ed-label">Phone</label>
                      <div className="form-input-with-unit">
                        <Phone size={14} />
                        <input 
                          className="ed-input" 
                          value={formData.phone}
                          onChange={e => set('phone', e.target.value)}
                          placeholder="+1..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px', fontStyle: 'italic' }}>
                  Complete information can be added later in settings.
                </p>
              </div>

              <style>{MODAL_STYLE}</style>
              <div className="sc-confirm-actions">
                <button type="button" className="confirm-btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
                <button type="submit" className="confirm-btn-solid" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="sc-spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Create Customer
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuickAddCustomerModal;

