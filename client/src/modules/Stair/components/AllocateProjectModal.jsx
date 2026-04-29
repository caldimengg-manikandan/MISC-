import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../../../config/api';
import SearchableSelect from '../../../components/common/SearchableSelect';
import QuickAddCustomerModal from '../../../components/project/QuickAddCustomerModal';
import toast from 'react-hot-toast';
import { Building2, X, FileText, CheckCircle2, Plus, UserCheck, Eye, Edit3, ChevronDown } from 'lucide-react';

// ── Access type pills ─────────────────────────────────────────────────────────
const ACCESS_TYPES = [
  { value: 'edit', label: 'Edit', icon: Edit3, desc: 'Can view & modify the project' },
  { value: 'view', label: 'View Only', icon: Eye, desc: 'Can only view project data' },
];

// ── User select dropdown ──────────────────────────────────────────────────────
function UserSelect({ users, value, onSelect, placeholder, loading, id }) {
  const [open, setOpen] = useState(false);
  const selected = users.find(u => String(u.id) === String(value));

  return (
    <div style={{ position: 'relative' }} id={id}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: '8px',
          border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '13px', color: selected ? '#1e293b' : '#94a3b8', textAlign: 'left'
        }}
      >
        <span>{selected ? (selected.full_name || selected.email) : (loading ? 'Loading...' : placeholder)}</span>
        <ChevronDown size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '200px', overflowY: 'auto',
          marginTop: '4px'
        }}>
          <div
            onClick={() => { onSelect(null); setOpen(false); }}
            style={{ padding: '9px 12px', cursor: 'pointer', fontSize: '13px', color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            — None —
          </div>
          {users.map(u => (
            <div
              key={u.id}
              onClick={() => { onSelect(u.id); setOpen(false); }}
              style={{
                padding: '9px 12px', cursor: 'pointer', fontSize: '13px',
                color: String(u.id) === String(value) ? '#10a37f' : '#1e293b',
                background: String(u.id) === String(value) ? '#f0fdf4' : 'transparent',
                fontWeight: String(u.id) === String(value) ? 600 : 400
              }}
              onMouseEnter={e => { if (String(u.id) !== String(value)) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => { if (String(u.id) !== String(value)) e.currentTarget.style.background = 'transparent'; }}
            >
              <div>{u.full_name || u.email}</div>
              {u.full_name && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{u.email}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AllocateProjectModal({ isOpen, onClose, onAllocate, initialData = {} }) {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState(initialData.projectName || '');
  const [projectNumber, setProjectNumber] = useState('');
  const [customerId, setCustomerId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Assignment state
  const [engineers, setEngineers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [assignedEngineerId, setAssignedEngineerId] = useState(null);
  const [reviewerId, setReviewerId] = useState(null);
  const [engineerAccess, setEngineerAccess] = useState('edit');
  const [reviewerAccess, setReviewerAccess] = useState('view');

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      fetchUsers();
      setProjectName(initialData.projectName || '');
    }
  }, [isOpen, initialData]);

  const getToken = () => localStorage.getItem('steel_token');

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/customers?status=active`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.data.success) setCustomers(res.data.customers);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/projects/users/list`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.data.success) {
        const all = res.data.users || [];
        setEngineers(all.filter(u => u.role === 'estimator' || u.role === 'engineer'));
        setAdmins(all.filter(u => u.role === 'admin' || u.role === 'superadmin'));
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setUsersLoading(false);
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
      const selectedCustomer = customers.find(c => c.id === customerId);

      const projectPayload = {
        ...initialData,
        projectName,
        projectNumber,
        customer_id: customerId,
        customer_name: selectedCustomer?.companyName || '',
        status: 'NEW',
        aiscCertified: 'Y',
        units: 'Imperial',
        assignedEngineerId: assignedEngineerId || null,
        reviewerId: reviewerId || null,
        accessType: engineerAccess,
      };

      const res = await axios.post(`${API_BASE_URL}/api/v1/estimations`, projectPayload, {
        headers: { Authorization: `Bearer ${getToken()}` }
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
        navigate(`/project/${newProjectId}/estimate/stair-railings`);
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

  const labelStyle = { fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' };
  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#1e293b', outline: 'none', boxSizing: 'border-box' };
  const sectionStyle = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginTop: '4px' };

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(5px)'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          style={{
            width: '100%', maxWidth: '520px', background: 'white',
            borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
            overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f0fdf4, #ffffff)',
            flexShrink: 0
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: '#10a37f' }} />
                Allocate to Project
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
                Save this estimation and optionally assign team members
              </p>
            </div>
            <button onClick={onClose} style={{
              background: '#f1f5f9', border: 'none', borderRadius: '50%',
              width: '30px', height: '30px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#64748b', cursor: 'pointer'
            }}>
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Project Name */}
              <div>
                <label style={labelStyle}>Project Name *</label>
                <input
                  style={inputStyle}
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. Westside Industrial"
                  autoFocus
                  id="allocate-project-name"
                />
              </div>

              {/* Customer */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ ...labelStyle, margin: 0 }}>Customer *</label>
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(true)}
                    style={{
                      background: 'none', border: 'none', color: '#3b82f6',
                      fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '2px 4px', borderRadius: '4px'
                    }}
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
                  id="allocate-customer-select"
                />
              </div>

              {/* Project Number */}
              <div>
                <label style={labelStyle}>Project Number</label>
                <input
                  style={inputStyle}
                  value={projectNumber}
                  onChange={e => setProjectNumber(e.target.value)}
                  placeholder="e.g. PRJ-2024-001"
                  id="allocate-project-number"
                />
              </div>

              {/* ── Team Assignment Section ── */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <UserCheck size={14} style={{ color: '#10a37f' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Team Assignment <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span>
                  </span>
                </div>

                <div style={sectionStyle}>
                  {/* Engineer Assignment */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ ...labelStyle, textTransform: 'none', letterSpacing: 0, fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                      Assign Engineer
                    </label>
                    <UserSelect
                      users={engineers}
                      value={assignedEngineerId}
                      onSelect={setAssignedEngineerId}
                      placeholder="Select engineer..."
                      loading={usersLoading}
                      id="allocate-engineer-select"
                    />
                    {assignedEngineerId && (
                      <div style={{ marginTop: '8px' }}>
                        <label style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', display: 'block' }}>Engineer Access Level</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {ACCESS_TYPES.map(at => {
                            const Icon = at.icon;
                            const active = engineerAccess === at.value;
                            return (
                              <button
                                key={at.value}
                                type="button"
                                onClick={() => setEngineerAccess(at.value)}
                                style={{
                                  flex: 1, padding: '7px 10px', borderRadius: '7px',
                                  border: `1.5px solid ${active ? '#10a37f' : '#e2e8f0'}`,
                                  background: active ? '#f0fdf4' : '#fff',
                                  cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                                  color: active ? '#065f46' : '#64748b',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                  transition: 'all 0.15s'
                                }}
                              >
                                <Icon size={12} />
                                {at.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reviewer Assignment */}
                  <div>
                    <label style={{ ...labelStyle, textTransform: 'none', letterSpacing: 0, fontSize: '12px', fontWeight: 600, color: '#374151' }}>
                      Assign Reviewer
                    </label>
                    <UserSelect
                      users={[...admins, ...engineers]}
                      value={reviewerId}
                      onSelect={setReviewerId}
                      placeholder="Select reviewer..."
                      loading={usersLoading}
                      id="allocate-reviewer-select"
                    />
                    {reviewerId && (
                      <div style={{ marginTop: '8px' }}>
                        <label style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', display: 'block' }}>Reviewer Access Level</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {ACCESS_TYPES.map(at => {
                            const Icon = at.icon;
                            const active = reviewerAccess === at.value;
                            return (
                              <button
                                key={at.value}
                                type="button"
                                onClick={() => setReviewerAccess(at.value)}
                                style={{
                                  flex: 1, padding: '7px 10px', borderRadius: '7px',
                                  border: `1.5px solid ${active ? '#10a37f' : '#e2e8f0'}`,
                                  background: active ? '#f0fdf4' : '#fff',
                                  cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                                  color: active ? '#065f46' : '#64748b',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                  transition: 'all 0.15s'
                                }}
                              >
                                <Icon size={12} />
                                {at.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0
          }}>
            <button onClick={onClose} style={{
              padding: '9px 18px', borderRadius: '8px', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer', border: '1px solid #e2e8f0',
              background: '#fff', color: '#475569'
            }}>
              Cancel
            </button>
            <button
              onClick={handleAllocate}
              id="btn-allocate-confirm"
              style={{
                padding: '9px 20px', borderRadius: '8px', fontSize: '13px',
                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none', background: loading ? '#6ee7b7' : '#10a37f',
                color: '#fff', display: 'flex', alignItems: 'center', gap: '7px',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(16,163,127,0.3)',
                transition: 'all 0.15s'
              }}
              disabled={loading}
            >
              <CheckCircle2 size={15} />
              {loading ? 'Saving...' : 'Save & Allocate'}
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
