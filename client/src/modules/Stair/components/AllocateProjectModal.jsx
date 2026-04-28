import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_BASE_URL from '../../../config/api';
import SearchableSelect from '../../../components/common/SearchableSelect';
import QuickAddCustomerModal from '../../../components/project/QuickAddCustomerModal';
import toast from 'react-hot-toast';
import { Building2, X, FileText, CheckCircle2, Plus } from 'lucide-react';

export default function AllocateProjectModal({ isOpen, onClose, onAllocate, initialData = {} }) {
  const [projectName, setProjectName] = useState(initialData.projectName || '');
  const [projectNumber, setProjectNumber] = useState('');
  const [customerId, setCustomerId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      // Reset form if initialData changed or if it was empty
      setProjectName(initialData.projectName || '');
    }
  }, [isOpen, initialData]);

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const token = localStorage.getItem('steel_token');
      const res = await axios.get(`${API_BASE_URL}/api/v1/customers?status=active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setCustomersLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!projectName.trim()) {
      toast.error('Project Name is required');
      return;
    }
    if (!customerId) {
        toast.error('Please select a customer');
        return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('steel_token');
      const selectedCustomer = customers.find(c => c.id === customerId);
      
      // 1. Create the project
      const projectPayload = {
        ...initialData, // Spread existing draft data (stairs, rails, etc.)
        projectName,
        projectNumber,
        customer_id: customerId,
        customer_name: selectedCustomer?.companyName || '',
        status: 'NEW',
        aiscCertified: 'Y',
        units: 'Imperial'
      };

      const res = await axios.post(`${API_BASE_URL}/api/v1/estimations`, projectPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const newProjectId = res.data.id;
        toast.success('Project created and estimate allocated!');
        onAllocate({
            id: newProjectId,
            projectName,
            projectNumber,
            customerId,
            customerName: selectedCustomer?.companyName,
            customerInfo: {
                company: selectedCustomer?.companyName,
                contact: selectedCustomer?.contactPerson,
                email: selectedCustomer?.email,
                phone: selectedCustomer?.phone,
                city: selectedCustomer?.city,
                state: selectedCustomer?.state
            }
        });
        // 🚀 FORCE REDIRECT to the new 1:1 path
        window.location.href = `/project/${newProjectId}/estimate/stair-railings`;
      } else {
        toast.error(res.data.message || 'Failed to create project');
      }
    } catch (err) {
      console.error('Error allocating project:', err);
      toast.error(err.response?.data?.message || 'Error creating project');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="allocate-modal"
        style={{
          width: '100%', maxWidth: '480px', background: 'white',
          borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden'
        }}
      >
        <div style={{
          padding: '24px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(to right, #f8fafc, #ffffff)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} className="text-blue-600" />
              Allocate to Project
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              Save this estimation by creating or choosing a project
            </p>
          </div>
          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#64748b', cursor: 'pointer'
          }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <div className="ed-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="ed-field">
              <label className="ed-label">Project Name *</label>
              <input 
                className="ed-input" 
                value={projectName} 
                onChange={e => setProjectName(e.target.value)} 
                placeholder="e.g. Westside Industrial"
                autoFocus
              />
            </div>
            
            <div className="ed-field">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="ed-label" style={{ margin: 0 }}>Customer *</label>
                <button 
                  type="button"
                  onClick={() => setShowQuickAdd(true)}
                  style={{ 
                    background: 'none', border: 'none', color: '#3b82f6', 
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '2px 4px', borderRadius: '4px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <Plus size={12} /> Add New
                </button>
              </div>
              <SearchableSelect 
                options={customers}
                valueKey="id"
                displayKey="companyName"
                placeholder="Select a customer..."
                value={customerId}
                onSelect={(customer) => setCustomerId(customer?.id)}
                loading={customersLoading}
                className="ed-customer-select"
              />
            </div>

            <div className="ed-field">
              <label className="ed-label">Project Number</label>
              <input 
                className="ed-input" 
                value={projectNumber} 
                onChange={e => setProjectNumber(e.target.value)} 
                placeholder="e.g. PRJ-2024-001" 
              />
            </div>
          </div>
        </div>

        <div style={{
          padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'flex-end', gap: '12px'
        }}>
          <button onClick={onClose} className="confirm-btn-outline" style={{ margin: 0 }}>
            Cancel
          </button>
          <button 
            onClick={handleAllocate} 
            className="confirm-btn-solid" 
            style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', background: '#10a37f' }}
            disabled={loading}
          >
            {loading ? 'Allocating...' : (
              <>
                <CheckCircle2 size={16} />
                Save & Allocate
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
    
    <QuickAddCustomerModal 
      isOpen={showQuickAdd}
      onClose={() => setShowQuickAdd(false)}
      onCustomerAdded={(newCustomer) => {
        setCustomers(prev => [newCustomer, ...prev]);
        setCustomerId(newCustomer.id);
        setShowQuickAdd(false);
      }}
    />
    </>
  );
}

