// client/src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format, startOfWeek, endOfWeek, isSameMonth, isSameDay,
  addMonths, subMonths, startOfMonth, endOfMonth, isToday
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, Search, ArrowRight,
  LayoutDashboard, FolderOpen, PenLine, BarChart3,
  Box, Database, ArrowUpDown, ChevronDown
} from 'lucide-react';
import { useEstimation } from '../../contexts/EstimationContext';
import AiHomeSearch from '../../components/ai/AiHomeSearch';
import './EstimationDashboard.css';



// ── Dashboard Page ────────────────────────────────────────────────────────────
export default function EstimationDashboard() {
  const navigate = useNavigate();
  const { dashboardStats, estimations, loading, fetchDashboardStats, fetchEstimations } = useEstimation();

  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchDashboardStats();
    fetchEstimations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Calendar grid
  const monthStart  = startOfMonth(currentMonth);
  const monthEnd    = endOfMonth(monthStart);
  const startDate   = startOfWeek(monthStart);
  const endDate     = endOfWeek(monthEnd);

  const renderCalendar = () => {
    const rows = [];
    let days = [];
    let day  = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay    = day;
        const fmtDate     = format(day, 'd');
        const dayProjects = estimations.filter(p =>
          p.dueDate && isSameDay(new Date(p.dueDate), cloneDay)
        );

        days.push(
          <div
            className={`cal-cell ${!isSameMonth(day, monthStart) ? 'disabled' : ''} ${isToday(day) ? 'today' : ''}`}
            key={day.toString()}
          >
            <span className="cal-number">{fmtDate}</span>
            <div className="cal-events">
              {dayProjects.map(p => (
                <div key={p.id} className={`cal-event event-${p.status?.toLowerCase()}`}>
                  {p.status}
                </div>
              ))}
            </div>
          </div>
        );
        day = new Date(day.setDate(day.getDate() + 1));
      }
      rows.push(<div className="cal-row" key={day.toString()}>{days}</div>);
      days = [];
    }
    return <div className="cal-body">{rows}</div>;
  };

  return (
    <div>
      {/* ── GPT-style home header ── */}
      <div className="dash-home">
        <h1 className="dash-greeting">Ready when you are.</h1>
        <AiHomeSearch />
      </div>

      {/* ── Dashboard data ── */}
      <div className="ems-dashboard">
        <div className="ems-top-filters">
          <div className="filter-group">
            <select><option>All Divisions</option></select>
            <select><option>All Engineers</option></select>
          </div>
        </div>

        <div className="ems-layout">
          {/* Left: metrics + calendar */}
          <div className="ems-col-left">
            <div className="ems-panel">
              <h3 className="panel-title">Monthly Overview</h3>
              <div className="metrics-bars">
                <div className="metric-box bg-blue">
                  <span className="m-label">New</span>
                  <span className="m-value">{dashboardStats.NEW}</span>
                </div>
                <div className="metric-box bg-amber">
                  <span className="m-label">Assigned</span>
                  <span className="m-value">{dashboardStats.ASSIGNED}</span>
                </div>
                <div className="metric-box bg-orange">
                  <span className="m-label">In Progress</span>
                  <span className="m-value">{dashboardStats.IN_PROGRESS}</span>
                </div>
                <div className="metric-box bg-purple">
                  <span className="m-label">Review</span>
                  <span className="m-value">{dashboardStats.REVIEW}</span>
                </div>
                <div className="metric-box bg-red">
                  <span className="m-label">Overdue</span>
                  <span className="m-value">{dashboardStats.OVERDUE}</span>
                </div>
                <div className="metric-box bg-green">
                  <span className="m-label">Submitted</span>
                  <span className="m-value">{dashboardStats.SUBMITTED}</span>
                </div>
              </div>
            </div>

            <div className="ems-panel cal-panel">
              <div className="cal-header">
                <button onClick={prevMonth}><ChevronLeft size={16} /></button>
                <h2>{format(currentMonth, 'MMM yyyy')}</h2>
                <button onClick={nextMonth}><ChevronRight size={16} /></button>
              </div>
              <div className="cal-days-header">
                <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div>
                <div>THU</div><div>FRI</div><div>SAT</div>
              </div>
              {renderCalendar()}
            </div>
          </div>

          {/* Right: project table */}
          <div className="ems-col-right">
            <div className="ems-panel table-panel">
              <div className="table-header">
                <div className="search-bar">
                  <Search size={14} />
                  <input type="text" placeholder="Search project, customer..." />
                </div>
                <div className="date-filters">
                  <span>Enquiry Date</span>
                  <button>Today</button>
                  <button>Tomorrow</button>
                  <button>This Week</button>
                  <button className="active">This Month</button>
                </div>
              </div>

              <div className="ems-table-wrap">
                <table className="ems-table">
                  <thead>
                    <tr>
                      <th>Project No</th>
                      <th>Project Name</th>
                      <th>Customer</th>
                      <th>Engineer</th>
                      <th>Status</th>
                      <th>Submission Deadline</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gpt-text-muted)' }}>Loading estimations…</td></tr>
                    ) : estimations.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gpt-text-muted)' }}>No estimations found.</td></tr>
                    ) : (
                      estimations.map(p => (
                        <tr key={p.id}>
                          <td className="t-pid">#{String(p.id).slice(-6).toUpperCase()}</td>
                          <td className="t-name">{p.projectName}</td>
                          <td>{p.customer_name || '—'}</td>
                          <td>{p.engineerId || '—'}</td>
                          <td>
                            <span className={`status-badge badge-${p.status?.toLowerCase()}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="t-date">
                            {p.dueDate ? (
                              <span className={p.status === 'OVERDUE' ? 'text-red' : ''}>
                                {format(new Date(p.dueDate), 'dd-MMM-yy')}
                              </span>
                            ) : '—'}
                          </td>
                          <td>
                            <button className="btn-go" onClick={() => navigate('/project-info?id=' + p.id)}>
                              <ArrowRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
