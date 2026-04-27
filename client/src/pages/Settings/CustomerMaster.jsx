// client/src/pages/Settings/CustomerMaster.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, Edit2, Trash2, ChevronRight, Mail, Phone, MapPin, CheckCircle, XCircle, Save, X, Building2, User, FileText } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import toast from 'react-hot-toast';
import './CustomerMaster.css';

export default function CustomerMaster() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
    status: 'active'
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Global Save Implementation
  useEffect(() => {
    const onGlobalSave = () => {
      // Only trigger if form is open (look for the unique save button in the sliding form)
      const formBtn = document.querySelector('.cm-save-btn');
      if (formBtn) formBtn.click();
    };
    window.addEventListener('app:save', onGlobalSave);
    return () => window.removeEventListener('app:save', onGlobalSave);
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('steel_token');
      const res = await axios.get(`${API_BASE_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      companyName: customer.companyName || '',
      contactPerson: customer.contactPerson || '',
      email: customer.email || '',
      phone: customer.phone || '',
      street: customer.street || '',
      city: customer.city || '',
      state: customer.state || '',
      zip: customer.zip || '',
      notes: customer.notes || '',
      status: customer.status || 'active'
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
    setFormData({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      notes: '',
      status: 'active'
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const t = toast.loading(editingCustomer ? "Updating customer..." : "Creating customer...");
    try {
      const token = localStorage.getItem('steel_token');
      const url = editingCustomer 
        ? `${API_BASE_URL}/api/customers/${editingCustomer.id}` 
        : `${API_BASE_URL}/api/customers`;
      const method = editingCustomer ? 'put' : 'post';

      const res = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success(editingCustomer ? "Customer updated" : "Customer created", { id: t });
        fetchCustomers();
        setShowForm(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed", { id: t });
    }
  };

  const toggleStatus = async (customer) => {
    const newStatus = customer.status === 'active' ? 'inactive' : 'active';
    const t = toast.loading(`Setting status to ${newStatus}...`);
    try {
      const token = localStorage.getItem('steel_token');
      const res = await axios.patch(`${API_BASE_URL}/api/customers/${customer.id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(`Customer ${newStatus}`, { id: t });
        fetchCustomers();
      }
    } catch (err) {
      toast.error("Status update failed", { id: t });
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${customer.companyName}"? This action cannot be undone.`)) {
      return;
    }

    const t = toast.loading("Deleting customer...");
    try {
      const token = localStorage.getItem('steel_token');
      const res = await axios.delete(`${API_BASE_URL}/api/customers/${customer.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success("Customer deleted", { id: t });
        fetchCustomers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Deletion failed", { id: t });
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="cm-root fade-in">
      <div className="cm-header">
        <div className="cm-header-left">
          <div className="cm-icon-box"><Users size={24} /></div>
          <div>
            <h1 className="cm-title">Customer Master</h1>
            <p className="cm-subtitle">Centrally manage your client database and contact records.</p>
          </div>
        </div>
        <button className="cm-add-btn" onClick={handleAddNew}>
          <Plus size={16} /> Add New Customer
        </button>
      </div>

      <div className="cm-toolbar">
        <div className="cm-search-wrapper">
          <Search size={16} className="cm-search-icon" />
          <input 
            type="text" 
            placeholder="Search by company, contact or email..." 
            className="cm-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="cm-content">
        <div className="cm-table-card">
          <table className="cm-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Contact Person</th>
                <th>Status</th>
                <th>Contact Info</th>
                <th>City / State</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="cm-empty">Loading customers...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan="6" className="cm-empty">No customers found.</td></tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className={customer.status === 'inactive' ? 'cm-row-inactive' : ''}>
                    <td>
                      <div className="cm-company-cell">
                        <div className="cm-avatar">{customer.companyName?.charAt(0)}</div>
                        <span className="cm-company-name">{customer.companyName}</span>
                      </div>
                    </td>
                    <td className="cm-text-bold">{customer.contactPerson || '—'}</td>
                    <td>
                      <span className={`cm-status-badge ${customer.status === 'active' ? 'active' : 'inactive'}`}>
                        {customer.status === 'active' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        {customer.status}
                      </span>
                    </td>
                    <td>
                      <div className="cm-contact-stack">
                        {customer.email && <span><Mail size={12} /> {customer.email}</span>}
                        {customer.phone && <span><Phone size={12} /> {customer.phone}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="cm-location-cell">
                         {customer.city ? `${customer.city}, ${customer.state || ''}` : '—'}
                      </div>
                    </td>
                    <td>
                      <div className="cm-actions">
                        <button className="cm-action-icon" title="Edit" onClick={() => handleEdit(customer)}>
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className={`cm-action-icon ${customer.status === 'active' ? 'danger' : 'success'}`} 
                          title={customer.status === 'active' ? 'Deactivate' : 'Activate'}
                          onClick={() => toggleStatus(customer)}
                        >
                          {customer.status === 'active' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        </button>
                        <button 
                          className="cm-action-icon danger" 
                          title="Delete Permanently"
                          onClick={() => handleDelete(customer)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Form */}
      <AnimatePresence>
        {showForm && (
          <div className="cm-modal-overlay" onClick={() => setShowForm(false)}>
            <motion.div 
              className="cm-side-form"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="cm-form-header">
                <div>
                  <h2 className="cm-form-title">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
                  <p className="cm-form-sub">{editingCustomer ? '#' + editingCustomer.id : 'Enter the company and contact details below.'}</p>
                </div>
                <button className="cm-close-btn" onClick={() => setShowForm(false)}><X size={20} /></button>
              </div>

              <form className="cm-form-body" onSubmit={handleSave}>
                <div className="cm-form-section">
                  <h3 className="cm-section-label"><Building2 size={16} /> Core Information</h3>
                  <div className="cm-field">
                    <label><Building2 size={14} /> Company Name *</label>
                    <div className="cm-input-wrapper">
                      <Building2 size={16} className="cm-field-icon" />
                      <input 
                        required
                        autoFocus
                        value={formData.companyName}
                        onChange={e => setFormData({...formData, companyName: e.target.value})}
                        placeholder="e.g. Acme Fabrication"
                      />
                    </div>
                  </div>
                  <div className="cm-field">
                    <label><User size={14} /> Contact Person</label>
                    <div className="cm-input-wrapper">
                      <User size={16} className="cm-field-icon" />
                      <input 
                        value={formData.contactPerson}
                        onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                        placeholder="Primary contact name"
                      />
                    </div>
                  </div>
                  <div className="cm-grid-2">
                    <div className="cm-field">
                      <label><Mail size={14} /> Email Address</label>
                      <div className="cm-input-wrapper">
                        <Mail size={16} className="cm-field-icon" />
                        <input 
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          placeholder="contact@company.com"
                        />
                      </div>
                    </div>
                    <div className="cm-field">
                      <label><Phone size={14} /> Phone Number</label>
                      <div className="cm-input-wrapper">
                        <Phone size={16} className="cm-field-icon" />
                        <input 
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="cm-form-section">
                  <h3 className="cm-section-label"><MapPin size={16} /> Office Location</h3>
                  <div className="cm-field">
                    <label><MapPin size={14} /> Street Address</label>
                    <div className="cm-input-wrapper">
                      <MapPin size={16} className="cm-field-icon" />
                      <input 
                        value={formData.street}
                        onChange={e => setFormData({...formData, street: e.target.value})}
                        placeholder="123 Industrial Dr"
                      />
                    </div>
                  </div>
                  <div className="cm-grid-3">
                    <div className="cm-field">
                      <label>City</label>
                      <input 
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                        placeholder="City"
                        style={{ paddingLeft: '16px' }}
                      />
                    </div>
                    <div className="cm-field">
                      <label>State</label>
                      <input 
                        value={formData.state}
                        onChange={e => setFormData({...formData, state: e.target.value})}
                        placeholder="ST"
                        style={{ paddingLeft: '16px' }}
                      />
                    </div>
                    <div className="cm-field">
                      <label>ZIP</label>
                      <input 
                        value={formData.zip}
                        onChange={e => setFormData({...formData, zip: e.target.value})}
                        placeholder="00000"
                        style={{ paddingLeft: '16px' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="cm-form-section">
                  <h3 className="cm-section-label"><FileText size={16} /> Additional Context</h3>
                  <div className="cm-field">
                    <label><FileText size={14} /> Internal Notes</label>
                    <textarea 
                      rows="4"
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      placeholder="Any specific requirements or project history..."
                      style={{ paddingLeft: '16px' }}
                    />
                  </div>
                </div>

                <div className="cm-form-actions">
                  <button type="button" className="cm-cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="cm-save-btn">
                    <Save size={16} /> {editingCustomer ? 'Update Record' : 'Create Customer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
