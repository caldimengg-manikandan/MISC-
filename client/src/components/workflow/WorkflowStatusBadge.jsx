// client/src/components/workflow/WorkflowStatusBadge.jsx
// Renders the colored state badge for any workflow_status value

import React from 'react';

const STATUS_CONFIG = {
  new: {
    label: 'NEW',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    ring: 'ring-slate-200',
  },
  assigned: {
    label: 'ASSIGNED',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    ring: 'ring-blue-100',
  },
  in_progress: {
    label: 'IN PROGRESS',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    ring: 'ring-amber-100',
    animate: true,
  },
  review: {
    label: 'IN REVIEW',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
    ring: 'ring-purple-100',
  },
  submitted: {
    label: 'SUBMITTED',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-100',
  },
};

export default function WorkflowStatusBadge({ status, size = 'md' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${padding} rounded-full font-bold ${textSize} tracking-wide ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}
    >
      <span className={`${dotSize} rounded-full ${cfg.dot} ${cfg.animate ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
}

