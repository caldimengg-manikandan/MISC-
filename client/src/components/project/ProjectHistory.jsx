import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderSearch, 
  Calendar, 
  ChevronRight, 
  FileText, 
  History, 
  Download,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import API_BASE_URL from '../../config/api';

export default function ProjectHistory() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('steel_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
          setProjects(data.projects);
        }
      } catch (error) {
        console.error('Error fetching project history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [navigate]);

  const filteredProjects = projects.filter(p => 
    p.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.projectNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectProject = (project) => {
    // Save to local storage for estimation module
    localStorage.setItem('steelProjectInfo', JSON.stringify({
      projectName: project.projectName,
      projectNumber: project.projectNumber,
      customerName: project.customerName || '',
      projectLocation: project.projectLocation || ''
    }));
    navigate('/estimate/stair-railings');
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Project History</h1>
            <p className="page-subtitle">View and manage previous estimations and reports</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="form-input data-type-string"
                style={{ paddingLeft: '32px', width: '240px', height: '38px' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="eng-card">
        <div className="eng-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History className="w-5 h-5 text-blue-500" />
            <span className="eng-card-title">Past Estimations</span>
          </div>
          <span className="info-chip chip-blue">{filteredProjects.length} Records</span>
        </div>
        
        <div className="eng-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading project history...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <FolderSearch className="w-12 h-12 text-slate-200" style={{ margin: '0 auto 16px' }} />
              <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>No projects found</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Try adjusting your search or start a new estimation</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="eng-table">
                <thead>
                  <tr>
                    <th>Project Details</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th>Stairs</th>
                    <th>Rails</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map(project => (
                    <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-primary-700)' }}>{project.projectName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                          <span className="data-badge dt-string" style={{ padding: '0 4px' }}>{project.projectNumber || 'N/A'}</span>
                          <span>•</span>
                          <span>{project.customerName || 'No Customer'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`info-chip ${
                          project.status === 'completed' ? 'chip-green' : 
                          project.status === 'in-progress' ? 'chip-blue' : 'chip-gray'
                        }`}>
                          {project.status || 'Draft'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar className="w-3 h-3" />
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{project.stairs?.length || 0}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{project.guardRails?.length || 0}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleSelectProject(project)}
                            className="header-btn header-btn-primary" 
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" /> Open
                          </button>
                          <button 
                            onClick={() => navigate('/reports', { state: { projectId: project.id } })}
                            className="header-btn header-btn-outline" 
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                          >
                            <FileText className="w-3 h-3 mr-1" /> Report
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
