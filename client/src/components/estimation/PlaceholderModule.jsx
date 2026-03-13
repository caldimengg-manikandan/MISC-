// src/components/estimation/PlaceholderModule.jsx
import React from 'react';

const MODULE_META = {
  railings: {
    icon: '🔧',
    title: 'Railings',
    subtitle: 'Standalone railing configurations for platforms, elevated walkways, and mezzanines',
    items: ['Straight Railing Runs', 'Corner Configurations', 'Curved Sections', 'Post Bases'],
  },
  ladders: {
    icon: '⬆',
    title: 'Ladders',
    subtitle: 'Fixed vertical and inclined ladder assemblies',
    items: ['Vertical Ladder Runs', 'Cage Configuration', 'Rest Platforms', 'Extension Brackets'],
  },
  bollards: {
    icon: '🔳',
    title: 'Bollards',
    subtitle: 'Pipe bollards, safety barriers, and protective post configurations',
    items: ['Standard Bollards', 'Removable Bollards', 'Decorative Bollards', 'Sleeve Configurations'],
  },
  gates: {
    icon: '🚪',
    title: 'Gates',
    subtitle: 'Personnel access gates, sliding gates, and swing gate hardware',
    items: ['Swing Gates', 'Sliding Gates', 'Safety Chain Gates', 'Latches & Hardware'],
  },
};

export default function PlaceholderModule({ type }) {
  const meta = MODULE_META[type] || MODULE_META.railings;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">{meta.icon} {meta.title}</h1>
        <p className="page-subtitle">{meta.subtitle}</p>
      </div>

      <div className="eng-card" style={{ marginBottom: '16px' }}>
        <div className="eng-card-body">
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: '12px', borderRadius: 'var(--radius-md)',
            background: '#fffbeb', border: '1px solid #fde68a',
          }}>
            <span style={{ fontSize: '20px' }}>🚧</span>
            <div>
              <div style={{ fontWeight: 600, color: '#92400e', fontSize: '13px' }}>Module Coming Soon</div>
              <div style={{ fontSize: '12px', color: '#b45309' }}>
                The {meta.title} configuration module is planned for a future release.
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <div className="form-section-title">Planned Features</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
              {meta.items.map(item => (
                <div key={item} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'white',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}>
                  <span style={{ color: 'var(--color-primary-500)' }}>◈</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Future 3D Viewer Placeholder */}
      <div className="eng-card">
        <div className="eng-card-header">
          <span className="eng-card-title">🎯 3D Structural Preview</span>
          <span className="info-chip chip-gray">Future Feature</span>
        </div>
        <div style={{
          height: '220px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '12px',
          borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
        }}>
          <span style={{ fontSize: '48px', opacity: 0.3 }}>🏗</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#93c5fd' }}>3D Visualization</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Interactive structural model viewer — coming in v2.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
