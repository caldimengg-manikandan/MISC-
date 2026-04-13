// client/src/components/project/QuickAddCustomerModal.jsx
import React, { useState } from 'react';
import { X, Save, User, Building2, Phone, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
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
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/customers`, formData, {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="sc-modal-backdrop" style={{ zIndex: 2000 }}>
          <motion.div 
            className="sc-modal-panel"
            style={{ maxWidth: '450px' }}
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
                      <Building2 size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                      <input 
                        className="ed-input" 
                        style={{ paddingLeft: '32px' }}
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
                      <User size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                      <input 
                        className="ed-input" 
                        style={{ paddingLeft: '32px' }}
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
                        <Mail size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                        <input 
                          type="email"
                          className="ed-input" 
                          style={{ paddingLeft: '32px' }}
                          value={formData.email}
                          onChange={e => set('email', e.target.value)}
                          placeholder="j.doe@acme.com"
                        />
                      </div>
                    </div>
                    <div className="ed-field">
                      <label className="ed-label">Phone</label>
                      <div className="form-input-with-unit">
                        <Phone size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                        <input 
                          className="ed-input" 
                          style={{ paddingLeft: '32px' }}
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

              <div className="sc-confirm-actions" style={{ padding: '16px 24px', background: 'var(--color-neutral-50)', borderTop: '1px solid var(--border-blueprint)' }}>
                <button type="button" className="confirm-btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
                <button type="submit" className="confirm-btn-solid" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Customer'}
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
