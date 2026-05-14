// client/src/components/library/LibrarySidebar.jsx
import React, { useState, useMemo } from 'react';
import {
  Lock, Paintbrush, Ruler, Shield, Minus, Hand,
  Activity, Layers, Grid, Wrench, Link, Zap,
  BookOpen, Settings,
} from 'lucide-react';

const CATEGORY_ORDER = [
  'finish_option', 'stringer_size', 'guardRail_type', 'wallRail_type',
  'grabRail_type', 'caneRail_type', 'stair_type', 'platform_type', 'grating_type',
  'mounting_type', 'connection_type', 'material_type', 'steel_grade_stair', 'steel_grade_rail',
  'pan_plate_config',
];

const CATEGORY_META = {
  finish_option:    { label: 'Finish Options',        Icon: Paintbrush },
  stringer_size:    { label: 'Stringer Sizes',        Icon: Ruler },
  guardRail_type:   { label: 'Guard Rail Types',      Icon: Shield },
  wallRail_type:    { label: 'Wall Rail Types',       Icon: Minus },
  grabRail_type:    { label: 'Grab Rail Types',       Icon: Hand },
  caneRail_type:    { label: 'Cane Rail Types',       Icon: Activity },
  stair_type:       { label: 'Stair Types',           Icon: Layers },
  platform_type:    { label: 'Platform Types',        Icon: Layers },
  grating_type:     { label: 'Grating & Tread',       Icon: Grid },
  mounting_type:    { label: 'Mounting & Hardware',   Icon: Wrench },
  connection_type:  { label: 'Connection Types',      Icon: Link },
  material_type:    { label: 'Material Types',        Icon: BookOpen },
  steel_grade_stair:{ label: 'Steel Grades (Stair)',  Icon: Zap },
  steel_grade_rail: { label: 'Steel Grades (Rail)',   Icon: Zap },
  pan_plate_config: { label: 'Pan Plate Configs',     Icon: Layers },
};

export default function LibrarySidebar({ activeCategory, onSelect, summary = {}, loading = false }) {
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();
    return CATEGORY_ORDER.filter(cat => {
      const meta = CATEGORY_META[cat];
      return !q || meta?.label.toLowerCase().includes(q) || cat.includes(q);
    });
  }, [search]);

  return (
    <aside className="lib-sidebar">
      {/* Brand */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--lib-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'var(--lib-accent-dim)', border: '1px solid rgba(16,163,127,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--lib-accent)',
          }}>
            <BookOpen size={14} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--lib-text)' }}>Library Hub</div>
            <div style={{ fontSize: 10, color: 'var(--lib-text-muted)' }}>
              {Object.keys(summary).length} categories
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="lib-sidebar-search">
        <input
          className="lib-sidebar-search-input"
          placeholder="Search categories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category List */}
      <div className="lib-sidebar-list">
        {filteredCategories.map(cat => {
          const meta = CATEGORY_META[cat] || { label: cat, Icon: BookOpen };
          const stat = summary[cat] || {};
          const isActive = activeCategory === cat;
          const hasLocked = (stat.locked || 0) > 0;

          return (
            <div
              key={cat}
              className={`lib-sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(cat)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onSelect(cat)}
            >
              <div className="lib-cat-icon">
                <meta.Icon size={13} />
              </div>

              <span className="lib-cat-label" title={meta.label}>
                {meta.label}
              </span>

              {/* Locked icon removed per user request */}

              {loading ? (
                <div className="lib-skeleton-cell" style={{ width: 24, height: 16, borderRadius: 9 }} />
              ) : (
                <span className="lib-cat-badge">
                  {stat.total ?? '—'}
                </span>
              )}
            </div>
          );
        })}


        {filteredCategories.length === 0 && (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--lib-text-muted)', fontSize: 12 }}>
            No categories match "{search}"
          </div>
        )}
      </div>
    </aside>
  );
}
