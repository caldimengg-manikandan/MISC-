import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

interface Alert {
  type: 'urgent' | 'warning' | 'info';
  title: string;
  description: string;
  count?: number;
  actionLabel?: string;
}

interface PipelineStage {
  status: string;
  count: number;
  percentage: number;
  avgDaysInStage: number;
}

interface ModuleHealth {
  module: string;
  usage: number;
  avgEstimationMinutes: number;
  avgQuoteValue: number;
  approvalRate: number;
}

interface DashboardData {
  kpis: {
    totalProjects: number;
    revenuePipeline: number;
    approvedRevenue: number;
    avgEstimationMinutes: number;
    completionRate: number;
  };
  statusDistribution: {
    new: number;
    inProgress: number;
    submitted: number;
    approved: number;
  };
  monthlyTrend: Array<{
    month: string;
    projectCount: number;
    revenue: number;
  }>;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [moduleHealth, setModuleHealth] = useState<ModuleHealth[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [metricsRes, alertsRes, pipelineRes, moduleRes] = await Promise.all([
          fetch('/api/v1/dashboard/metrics'),
          fetch('/api/v1/dashboard/alerts'),
          fetch('/api/v1/dashboard/pipeline'),
          fetch('/api/v1/dashboard/module-health'),
        ]);

        if (!metricsRes.ok || !alertsRes.ok || !pipelineRes.ok || !moduleRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [metricsData, alertsData, pipelineData, moduleData] = await Promise.all([
          metricsRes.json(),
          alertsRes.json(),
          pipelineRes.json(),
          moduleRes.json(),
        ]);

        setDashboardData(metricsData);
        setAlerts(alertsData.alerts);
        setPipeline(pipelineData.pipeline);
        setModuleHealth(moduleData.moduleHealth);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="dashboard-container">No data available</div>;
  }

  const { kpis, statusDistribution, monthlyTrend } = dashboardData;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return '⚠️';
      case 'warning':
        return '⏱️';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const statusColors = {
    NEW: '#3B8BD4',
    IN_PROGRESS: '#854F0B',
    SUBMITTED: '#185FA5',
    APPROVED: '#3B6D11',
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">Pipeline insights & business intelligence</p>
      </div>

      {/* KPI Cards - Top Row */}
      <section className="kpi-section">
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Total Projects</div>
            <div className="kpi-value">{kpis.totalProjects}</div>
            <div className="kpi-sublabel">All time</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Revenue Pipeline</div>
            <div className="kpi-value">{formatCurrency(kpis.revenuePipeline)}</div>
            <div className="kpi-sublabel">{formatCurrency(kpis.approvedRevenue)} approved</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Avg. Estimation Time</div>
            <div className="kpi-value">{kpis.avgEstimationMinutes} min</div>
            <div className="kpi-sublabel">Per project</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Completion Rate</div>
            <div className="kpi-value">{kpis.completionRate}%</div>
            <div className="kpi-sublabel">Last 30 days</div>
          </div>
        </div>
      </section>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <section className="alerts-section">
          <h2>Attention Required</h2>
          <div className="alerts-grid">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`alert-card alert-${alert.type}`}>
                <div className="alert-header">
                  <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                  <h3>{alert.title}</h3>
                </div>
                <p className="alert-description">{alert.description}</p>
                {alert.actionLabel && (
                  <button className="alert-action" onClick={() => console.log(`Action: ${alert.actionLabel}`)}>
                    {alert.actionLabel} →
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pipeline Funnel */}
      <section className="pipeline-section">
        <h2>Pipeline Funnel</h2>
        <div className="pipeline-container">
          <div className="pipeline-stages">
            {pipeline.map((stage, idx) => (
              <div key={idx} className="pipeline-stage">
                <div
                  className="pipeline-bar"
                  style={{
                    backgroundColor: statusColors[stage.status as keyof typeof statusColors] || '#ccc',
                    width: `${Math.max(stage.percentage, 15)}%`,
                  }}
                >
                  <span className="pipeline-count">{stage.count}</span>
                </div>
                <div className="pipeline-label">
                  <div className="stage-name">{stage.status.replace('_', ' ')}</div>
                  <div className="stage-meta">{stage.percentage}% • {stage.avgDaysInStage}d avg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monthly Trend Chart */}
      <section className="chart-section">
        <h2>Monthly Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" label={{ value: 'Projects', angle: -90, position: 'insideLeft' }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: 'Revenue ($)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'projectCount') return [value, 'Projects'];
                return [formatCurrency(value as number), 'Revenue'];
              }}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="projectCount" stroke="#185FA5" name="Projects" />
            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#3B6D11" name="Revenue" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Module Health */}
      <section className="module-health-section">
        <h2>Module Performance</h2>
        <div className="module-grid">
          {moduleHealth.map((module, idx) => (
            <div key={idx} className="module-card">
              <div className="module-name">{module.module}</div>
              <div className="module-stat">
                <span className="stat-label">Usage</span>
                <span className="stat-value">{module.usage} projects</span>
              </div>
              <div className="module-stat">
                <span className="stat-label">Avg Time</span>
                <span className="stat-value">{module.avgEstimationMinutes} min</span>
              </div>
              <div className="module-stat">
                <span className="stat-label">Avg Quote</span>
                <span className="stat-value">{formatCurrency(module.avgQuoteValue)}</span>
              </div>
              <div className="module-stat">
                <span className="stat-label">Approval Rate</span>
                <span className="stat-value">{module.approvalRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Status Distribution Pie Chart */}
      <section className="chart-section">
        <h2>Current Status Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: 'New', value: statusDistribution.new },
                { name: 'In Progress', value: statusDistribution.inProgress },
                { name: 'Submitted', value: statusDistribution.submitted },
                { name: 'Approved', value: statusDistribution.approved },
              ]}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              <Cell fill="#3B8BD4" />
              <Cell fill="#854F0B" />
              <Cell fill="#185FA5" />
              <Cell fill="#3B6D11" />
            </Pie>
            <Tooltip formatter={(value) => [`${value} projects`, 'Count']} />
          </PieChart>
        </ResponsiveContainer>
      </section>

      {/* Quick Actions */}
      <section className="actions-section">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <button className="action-btn" onClick={() => window.location.href = '/estimation/guard-rail'}>
            + New Guard Rail
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/projects'}>
            View Projects
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/reports'}>
            Generate Report
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/config'}>
            System Settings
          </button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

