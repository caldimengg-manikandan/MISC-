// client/src/components/workflow/WorkflowActionBar.jsx
// Context-aware action bar — shows different actions based on current status and user role.
// Also renders the amber push-back banner when review_comment is present.

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, Play, Send, CheckCircle, RotateCcw, 
  Mail, AlertTriangle, ChevronDown, UserPlus, Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import API_BASE_URL from '../../config/api';
import toast from 'react-hot-toast';
import WorkflowStatusBadge from './WorkflowStatusBadge';
import PushBackModal from './PushBackModal';
import SendToClientModal from './SendToClientModal';
import AddEngineerModal from './AddEngineerModal';
import SendForReviewModal from './SendForReviewModal';
import { generateProposalPDF, generateFabricationExcel } from '../../services/exportService';

export default function WorkflowActionBar({ project, onStatusChange, onEngineerChange }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedEngineer, setSelectedEngineer] = useState(project?.assigned_engineer_id || user?.id || '');
  const [showPushBackModal, setShowPushBackModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSendForReviewModal, setShowSendForReviewModal] = useState(false);
  const [showAddEngineerModal, setShowAddEngineerModal] = useState(false);

  const token = localStorage.getItem('steel_token');
  const isAdmin = ['admin', 'owner', 'superadmin'].includes(user?.role);
  const isCreator = project?.userId === user?.id || project?.user_id === user?.id || !project?.id;
  const canAssign = isAdmin || isCreator;
  const status = (project?.workflow_status || project?.status || 'new').toLowerCase();
  const reviewComment = project?.review_comment;
  const revisionNumber = project?.revision_number || 0;

  // Load users list for assign dropdown
  useEffect(() => {
    if (canAssign && ['new', 'assigned', 'in_progress'].includes(status)) {
      fetch(`${API_BASE_URL}/api/v1/projects/users/list`, { credentials: 'include',
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => { if (data.success) setUsers(data.users); })
        .catch(() => {});
    }
  }, [canAssign, status, token]);

  const call = async (endpoint, method = 'PATCH', body = null) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/projects/${project.id}/${endpoint}`, { credentials: 'include',
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    } finally {
      setSaving(false);
    }
  };

  // ── Action Handlers ────────────────────────────────────────────────────────

  const handleAssign = async () => {
    if (!project?.id) return toast.error('Please save the project first to assign an engineer');
    if (!selectedEngineer) return toast.error('Select an engineer first');
    try {
      const data = await call('assign', 'PATCH', { assignedEngineerId: parseInt(selectedEngineer) });
      toast.success(data.message);
      onStatusChange?.();
    } catch (e) { toast.error(e.message); }
  };

  const handleStart = async () => {
    try {
      const data = await call('start');
      toast.success(data.message);
      onStatusChange?.();
    } catch (e) { toast.error(e.message); }
  };

  const handleSubmitReview = async (payload) => {
    try {
      const data = await call('submit-review', 'PATCH', payload);
      toast.success(data.message);
      setShowSendForReviewModal(false);
      onStatusChange?.();
    } catch (e) { toast.error(e.message); }
  };

  const handleApprove = () => {
    // Instead of directly submitting, prompt SendToClientModal
    setShowSendModal(true);
  };

  const handlePushBack = async (comment) => {
    try {
      const data = await call('pushback', 'PATCH', { comment });
      toast.success(data.message);
      setShowPushBackModal(false);
      onStatusChange?.();
    } catch (e) { toast.error(e.message); }
  };

  const handleSendToClient = async (payload) => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('clientEmail', payload.clientEmail);
      formData.append('cc', payload.cc);
      formData.append('customMessage', payload.customMessage);
      formData.append('attachmentType', payload.attachmentType);

      // Hydrate state for generators
      const parsedStairs = typeof project.stairs === 'string' ? JSON.parse(project.stairs) : project.stairs || [];
      const parsedEst = typeof project.estimationResult === 'string' ? JSON.parse(project.estimationResult) : project.estimationResult || {};

      if (payload.attachmentType === 'PDF' || payload.attachmentType === 'Both') {
         const pdfBlob = generateProposalPDF(project, parsedStairs, true);
         formData.append('attachments', pdfBlob, 'Estimation_Proposal.pdf');
      }
      if (payload.attachmentType === 'BOM' || payload.attachmentType === 'Both') {
         const bomBlob = await generateFabricationExcel(project, parsedStairs, parsedEst, true);
         formData.append('attachments', bomBlob, 'Estimation_BOM.xlsx');
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/projects/${project.id}/send-to-client`, { credentials: 'include',
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // NO Content-Type allows boundary generation
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      toast.success(data.message);
      setShowSendModal(false);
      onStatusChange?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddEngineer = async ({ email, full_name }) => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/projects/users/create`, { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, full_name })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setUsers([...users, data.user]);
        setSelectedEngineer(data.user.id);
        setShowAddEngineerModal(false);
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Render nothing for unknown states ─────────────────────────────────────
  const hasActions = 
    canAssign || // Creator or Admin always has actions if they fall into the conditions below
    status === 'assigned' ||
    status === 'in_progress' ||
    status === 'review' ||
    status === 'submitted';

  return (
    <>
      <div className="space-y-3">
        {/* Push-back amber comment banner */}
        <AnimatePresence>
          {reviewComment && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl"
            >
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
                  Revision Required {revisionNumber > 1 ? `(Review #${revisionNumber})` : ''}
                </p>
                <p className="text-sm text-amber-700 font-medium leading-relaxed">{reviewComment}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action bar */}
        {hasActions && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl shadow-sm"
          >
            <div className="flex items-center gap-2 mr-2">
              <WorkflowStatusBadge status={status} />
              {revisionNumber > 0 && (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Rev #{revisionNumber}
                </span>
              )}
            </div>

            <div className="h-4 w-px bg-slate-100" />

            {/* Admin or Creator: Assign Engineer */}
            {canAssign && ['new', 'assigned', 'in_progress'].includes(status) && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={selectedEngineer}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedEngineer(newId);
                      if (onEngineerChange) {
                        const selectedUser = users.find(u => u.id.toString() === newId.toString());
                        if (selectedUser) onEngineerChange(selectedUser.email);
                      }
                    }}
                    className="pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none outline-none focus:border-[--gpt-accent] font-medium"
                  >
                    <option value="">Select Engineer...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddEngineerModal(true)}
                    disabled={saving}
                    title="Add New Engineer"
                    className="flex items-center justify-center p-2 text-slate-400 hover:text-[--gpt-accent] hover:bg-slate-50 border border-transparent rounded-lg transition-all"
                  >
                    <UserPlus size={16} />
                  </button>
                )}
                <button
                  onClick={handleAssign}
                  disabled={saving || !selectedEngineer}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95"
                >
                  <UserCheck size={15} />
                  Assign Engineer
                </button>
              </div>
            )}

            {/* Estimator or Admin: Start (ASSIGNED state) */}
            {status === 'assigned' && (
              <button
                onClick={handleStart}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95"
              >
                <Play size={15} />
                {saving ? 'Starting...' : 'Start Project'}
              </button>
            )}

            {/* Estimator or Admin: Send for Review (IN PROGRESS) */}
            {status === 'in_progress' && (
              <button
                onClick={() => setShowSendForReviewModal(true)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95"
              >
                <Send size={15} />
                {saving ? 'Submitting...' : revisionNumber > 0 ? `Send for Review (Rev #${revisionNumber + 1})` : 'Send for Review'}
              </button>
            )}

            {/* Admin: Approve or Push Back (REVIEW state) */}
            {status === 'review' && project?.reviewer_id === user?.id && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95"
                >
                  <CheckCircle size={15} />
                  {saving ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => setShowPushBackModal(true)}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95"
                >
                  <RotateCcw size={15} />
                  Push Back
                </button>
              </>
            )}

            {/* Admin: Send to Client (SUBMITTED state) */}
            {isAdmin && status === 'submitted' && (
              <button
                onClick={() => setShowSendModal(true)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95"
              >
                <Mail size={15} />
                Send to Client
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <PushBackModal
        isOpen={showPushBackModal}
        onClose={() => setShowPushBackModal(false)}
        onConfirm={handlePushBack}
        projectName={project?.projectName}
        saving={saving}
      />
      <SendForReviewModal
        isOpen={showSendForReviewModal}
        onClose={() => setShowSendForReviewModal(false)}
        onConfirm={handleSubmitReview}
        project={project}
        saving={saving}
      />
      <SendToClientModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onConfirm={handleSendToClient}
        project={project}
        saving={saving}
      />
      <AddEngineerModal
        isOpen={showAddEngineerModal}
        onClose={() => setShowAddEngineerModal(false)}
        onConfirm={handleAddEngineer}
        saving={saving}
      />
    </>
  );
}

