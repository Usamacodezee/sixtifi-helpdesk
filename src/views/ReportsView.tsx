import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { PriorityBadge } from '../components/ui/Badge';
import { SelectInput } from '../components/ui/FormControls';
import { Table, Column } from '../components/ui/Table';
import {
  Download,
  Filter,
  X,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import './ReportsView.css';

export interface TeamWorkloadReportItem {
  teamId: string;
  teamName: string;
  openTickets: number;
  resolvedCount: number;
  slaAtRiskCount: number;
  slaBreachedCount: number;
  avgResolutionTime: string;
}

export interface TopRequestTypeItem {
  id: string;
  category: string;
  requestsCount: number;
  percentageOfTotal: string;
}

export interface ReportsViewProps {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
  onNavigateToAllTicketsWithCategoryFilter: (categoryName: string) => void;
  onNavigateToTeamDetail: (teamId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  onShowToast,
  onNavigateToAllTicketsWithCategoryFilter,
  onNavigateToTeamDetail
}) => {
  // Global Filter State
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Extended More Filters State
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [, setStatusFilter] = useState('all');
  const [, setDepartmentFilter] = useState('all');
  const [, setLocationFilter] = useState('all');

  // Export Menu State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Sample Team Workload Data
  const teamWorkloadList: TeamWorkloadReportItem[] = [
    { teamId: 'team-hr', teamName: 'HR Support', openTickets: 24, resolvedCount: 86, slaAtRiskCount: 4, slaBreachedCount: 1, avgResolutionTime: '16h' },
    { teamId: 'team-payroll', teamName: 'Payroll Support', openTickets: 12, resolvedCount: 64, slaAtRiskCount: 5, slaBreachedCount: 3, avgResolutionTime: '22h' },
    { teamId: 'team-it', teamName: 'IT Support', openTickets: 10, resolvedCount: 52, slaAtRiskCount: 2, slaBreachedCount: 1, avgResolutionTime: '9h' },
    { teamId: 'team-admin', teamName: 'Administration Support', openTickets: 8, resolvedCount: 31, slaAtRiskCount: 1, slaBreachedCount: 0, avgResolutionTime: '11h' }
  ];

  // Sample Top Request Types Data
  const topRequestTypesList: TopRequestTypeItem[] = [
    { id: 'tr-1', category: 'Attendance', requestsCount: 46, percentageOfTotal: '10.7%' },
    { id: 'tr-2', category: 'Payroll', requestsCount: 38, percentageOfTotal: '8.9%' },
    { id: 'tr-3', category: 'Leave', requestsCount: 31, percentageOfTotal: '7.2%' },
    { id: 'tr-4', category: 'IT', requestsCount: 28, percentageOfTotal: '6.5%' }
  ];

  // Table Columns for Team Workload
  const teamColumns: Column<TeamWorkloadReportItem>[] = [
    {
      key: 'teamName',
      header: 'Team',
      sortable: true,
      render: item => (
        <span
          className="table-cell-id"
          style={{ fontWeight: 700, cursor: 'pointer' }}
          onClick={e => {
            e.stopPropagation();
            onNavigateToTeamDetail(item.teamId);
          }}
        >
          {item.teamName}
        </span>
      )
    },
    {
      key: 'openTickets',
      header: 'Open Tickets',
      sortable: true,
      render: item => <span style={{ fontSize: '13px', color: '#1E40AF', fontWeight: 600 }}>{item.openTickets}</span>
    },
    {
      key: 'resolvedCount',
      header: 'Resolved',
      sortable: true,
      render: item => <span style={{ fontSize: '13px', color: '#065F46', fontWeight: 600 }}>{item.resolvedCount}</span>
    },
    {
      key: 'slaAtRiskCount',
      header: 'SLA At Risk',
      sortable: true,
      render: item => <span style={{ fontSize: '13px', color: '#D97706', fontWeight: 700 }}>{item.slaAtRiskCount}</span>
    },
    {
      key: 'slaBreachedCount',
      header: 'SLA Breached',
      sortable: true,
      render: item => <span style={{ fontSize: '13px', color: '#DC2626', fontWeight: 700 }}>{item.slaBreachedCount}</span>
    },
    {
      key: 'avgResolutionTime',
      header: 'Avg Resolution Time',
      sortable: true,
      render: item => <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.avgResolutionTime}</span>
    }
  ];

  // Table Columns for Top Request Types
  const requestTypeColumns: Column<TopRequestTypeItem>[] = [
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: item => (
        <span
          style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary-600)', cursor: 'pointer' }}
          onClick={() => onNavigateToAllTicketsWithCategoryFilter(item.category)}
        >
          {item.category}
        </span>
      )
    },
    {
      key: 'requestsCount',
      header: 'Requests',
      sortable: true,
      render: item => <span style={{ fontSize: '13px', fontWeight: 700 }}>{item.requestsCount}</span>
    },
    {
      key: 'percentageOfTotal',
      header: '% of Total',
      sortable: true,
      render: item => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.percentageOfTotal}</span>
    }
  ];

  // Clear Filters Action
  const handleResetFilters = () => {
    setDateRange('Last 30 Days');
    setCategoryFilter('all');
    setTeamFilter('all');
    setPriorityFilter('all');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setLocationFilter('all');
    onShowToast('info', 'Filters Reset', 'Reset all report parameters.');
  };

  return (
    <div className="reports-container">
      {/* PAGE HEADER */}
      <PageHeader
        breadcrumbs={[
          { label: 'Sixtifi WFM' },
          { label: 'Helpdesk' },
          { label: 'Reports & Analytics' }
        ]}
        title="Helpdesk Reports"
        subtitle="Understand request volume, resolution performance and SLA health."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2-5)', alignItems: 'center' }}>
            <div style={{ width: '150px' }}>
              <SelectInput value={dateRange} onChange={e => setDateRange(e.target.value)}>
                <option value="Today">Today</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Last 90 Days">Last 90 Days</option>
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
              </SelectInput>
            </div>

            {/* EXPORT REPORT MENU */}
            <div style={{ position: 'relative' }}>
              <Button
                variant="outline"
                leftIcon={<Download size={15} />}
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              >
                Export Report
              </Button>

              {isExportMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '36px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 60,
                    minWidth: '150px',
                    padding: '4px 0'
                  }}
                >
                  <button
                    style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onShowToast('info', 'Export PDF', 'Generating PDF report summary...');
                    }}
                  >
                    <FileText size={14} />
                    Export PDF
                  </button>

                  <button
                    style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onShowToast('info', 'Export Excel', 'Generating Excel analytics spreadsheet...');
                    }}
                  >
                    <FileSpreadsheet size={14} />
                    Export Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* SECTION 9 — REPORT FILTERS TOOLBAR */}
      <div className="filter-toolbar-box">
        <div className="toolbar-primary-row">
          <div className="toolbar-controls-left">
            <div style={{ width: '160px' }}>
              <SelectInput value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                <option value="attendance">Attendance</option>
                <option value="payroll">Payroll</option>
                <option value="leave">Leave</option>
                <option value="hr">HR</option>
                <option value="it">IT</option>
              </SelectInput>
            </div>

            <div style={{ width: '160px' }}>
              <SelectInput value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
                <option value="all">All Teams</option>
                <option value="hr">HR Support</option>
                <option value="payroll">Payroll Support</option>
                <option value="it">IT Support</option>
                <option value="admin">Admin Support</option>
              </SelectInput>
            </div>

            <div style={{ width: '140px' }}>
              <SelectInput value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </SelectInput>
            </div>

            {/* MORE FILTERS BUTTON */}
            <Button
              variant="secondary"
              leftIcon={<Filter size={14} />}
              onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
            >
              More Filters
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </div>

        {/* ACTIVE REMOVABLE FILTER TAGS */}
        {(dateRange !== 'Last 30 Days' || categoryFilter !== 'all' || teamFilter !== 'all' || priorityFilter !== 'all') && (
          <div className="active-chips-row">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Filters:</span>
            {dateRange !== 'Last 30 Days' && (
              <span className="filter-chip-tag">
                Date: {dateRange}
                <button className="chip-remove-btn" onClick={() => setDateRange('Last 30 Days')}><X size={12} /></button>
              </span>
            )}
            {categoryFilter !== 'all' && (
              <span className="filter-chip-tag">
                Category: {categoryFilter}
                <button className="chip-remove-btn" onClick={() => setCategoryFilter('all')}><X size={12} /></button>
              </span>
            )}
            {teamFilter !== 'all' && (
              <span className="filter-chip-tag">
                Team: {teamFilter}
                <button className="chip-remove-btn" onClick={() => setTeamFilter('all')}><X size={12} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* SECTION 1 — EXECUTIVE SUMMARY (6 KPI Cards) */}
      <div className="reports-kpi-grid">
        <div className="reports-kpi-card">
          <span className="reports-kpi-title">Total Requests</span>
          <span className="reports-kpi-val">428</span>
          <span className="reports-kpi-trend positive"><TrendingUp size={12} /> +8.4% vs prev 30d</span>
        </div>

        <div className="reports-kpi-card">
          <span className="reports-kpi-title">Open</span>
          <span className="reports-kpi-val" style={{ color: '#1E40AF' }}>54</span>
          <span className="reports-kpi-trend positive"><TrendingDown size={12} /> -2.1% vs prev 30d</span>
        </div>

        <div className="reports-kpi-card">
          <span className="reports-kpi-title">Resolved</span>
          <span className="reports-kpi-val" style={{ color: '#065F46' }}>342</span>
          <span className="reports-kpi-trend positive"><TrendingUp size={12} /> +10.2% vs prev 30d</span>
        </div>

        <div className="reports-kpi-card">
          <span className="reports-kpi-title">Avg Response Time</span>
          <span className="reports-kpi-val">2h 18m</span>
          <span className="reports-kpi-trend positive"><TrendingDown size={12} /> -12m vs prev 30d</span>
        </div>

        <div className="reports-kpi-card">
          <span className="reports-kpi-title">Avg Resolution Time</span>
          <span className="reports-kpi-val">18h 42m</span>
          <span className="reports-kpi-trend positive"><TrendingDown size={12} /> -1.5h vs prev 30d</span>
        </div>

        <div className="reports-kpi-card">
          <span className="reports-kpi-title">SLA Compliance</span>
          <span className="reports-kpi-val" style={{ color: '#047857' }}>94%</span>
          <span className="reports-kpi-trend positive"><TrendingUp size={12} /> +1.8% vs prev 30d</span>
        </div>
      </div>

      {/* SECTION 2 — REQUEST VOLUME TREND (Large Dual Line / Area Chart) */}
      <div className="report-card-box">
        <div className="report-card-header">
          <div>
            <span className="report-card-title">Request Volume Trend</span>
            <div className="report-card-subtitle">Number of requests created vs resolved over time.</div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '12px', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366F1' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#6366F1', borderRadius: '2px' }} />
              Created Requests
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#10B981', borderRadius: '2px' }} />
              Resolved Requests
            </span>
          </div>
        </div>

        <div className="volume-chart-container">
          <svg className="volume-chart-svg" viewBox="0 0 1000 200" preserveAspectRatio="none">
            {/* Grid background lines */}
            <line x1="0" y1="40" x2="1000" y2="40" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="0" y1="90" x2="1000" y2="90" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="0" y1="140" x2="1000" y2="140" stroke="#F1F5F9" strokeWidth="1" />

            {/* Created Requests Line (Purple) */}
            <path
              d="M0,130 Q150,80 300,100 T600,60 T1000,40"
              fill="none"
              stroke="#6366F1"
              strokeWidth="3"
            />

            {/* Resolved Requests Line (Green) */}
            <path
              d="M0,150 Q150,110 300,120 T600,80 T1000,50"
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
              strokeDasharray="4 2"
            />
          </svg>
        </div>
      </div>

      {/* SECTION 3 & 5 — TWO COLUMN GRID (Requests by Category & Resolution Performance) */}
      <div className="charts-grid-two-col">
        {/* SECTION 3 — REQUESTS BY CATEGORY */}
        <div className="report-card-box">
          <div className="report-card-header">
            <div>
              <span className="report-card-title">Requests by Category</span>
              <div className="report-card-subtitle">Request volume breakdown across categories</div>
            </div>
          </div>

          <div className="bar-chart-list">
            {[
              { name: 'Attendance', count: 128, percent: 80 },
              { name: 'Payroll', count: 92, percent: 60 },
              { name: 'Leave', count: 76, percent: 50 },
              { name: 'HR', count: 64, percent: 42 },
              { name: 'IT', count: 43, percent: 28 },
              { name: 'Administration', count: 25, percent: 16 }
            ].map(cat => (
              <div
                key={cat.name}
                className="bar-chart-row"
                onClick={() => onNavigateToAllTicketsWithCategoryFilter(cat.name)}
              >
                <div className="bar-chart-label-group">
                  <span>{cat.name}</span>
                  <span style={{ color: 'var(--color-primary-600)' }}>{cat.count} requests</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${cat.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5 — RESOLUTION PERFORMANCE BY CATEGORY */}
        <div className="report-card-box">
          <div className="report-card-header">
            <div>
              <span className="report-card-title">Resolution Performance</span>
              <div className="report-card-subtitle">Average resolution time per category (identifies bottlenecks)</div>
            </div>
          </div>

          <div className="bar-chart-list">
            {[
              { name: 'Attendance', hours: '12h', percent: 54 },
              { name: 'HR', hours: '14h', percent: 63 },
              { name: 'Leave', hours: '16h', percent: 72 },
              { name: 'Payroll', hours: '22h (Bottleneck)', percent: 98, isBottleneck: true },
              { name: 'IT', hours: '9h', percent: 40 },
              { name: 'Administration', hours: '11h', percent: 50 }
            ].map(cat => (
              <div key={cat.name} className="bar-chart-row">
                <div className="bar-chart-label-group">
                  <span>{cat.name}</span>
                  <span style={{ color: cat.isBottleneck ? '#DC2626' : 'var(--text-secondary)' }}>{cat.hours}</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${cat.percent}%`,
                      backgroundColor: cat.isBottleneck ? '#EF4444' : 'var(--color-primary-600)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4 & 7 — TWO COLUMN GRID (SLA Performance & Priority Distribution) */}
      <div className="charts-grid-two-col">
        {/* SECTION 4 — SLA PERFORMANCE */}
        <div className="report-card-box">
          <div className="report-card-header">
            <div>
              <span className="report-card-title">SLA Health & Performance</span>
              <div className="report-card-subtitle">Overall compliance against target SLAs</div>
            </div>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#047857' }}>94% SLA Compliance</span>
          </div>

          <div className="health-distribution-bar">
            <div className="health-seg-ontrack" style={{ width: '89%' }} />
            <div className="health-seg-atrisk" style={{ width: '7%' }} />
            <div className="health-seg-breached" style={{ width: '4%' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginTop: '8px' }}>
            <div style={{ padding: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>On Track</span>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#047857' }}>402</div>
            </div>

            <div style={{ padding: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>At Risk</span>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#D97706' }}>18</div>
            </div>

            <div style={{ padding: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Breached</span>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#DC2626' }}>8</div>
            </div>
          </div>
        </div>

        {/* SECTION 7 — PRIORITY DISTRIBUTION */}
        <div className="report-card-box">
          <div className="report-card-header">
            <div>
              <span className="report-card-title">Requests by Priority</span>
              <div className="report-card-subtitle">Ticket distribution by priority urgency tier</div>
            </div>
          </div>

          <div className="priority-dist-grid">
            <div className="priority-dist-card">
              <PriorityBadge priority="Low" />
              <span style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>102</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>23.8% of total</span>
            </div>

            <div className="priority-dist-card">
              <PriorityBadge priority="Medium" />
              <span style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>236</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>55.1% of total</span>
            </div>

            <div className="priority-dist-card">
              <PriorityBadge priority="High" />
              <span style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>74</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>17.2% of total</span>
            </div>

            <div className="priority-dist-card">
              <PriorityBadge priority="Urgent" />
              <span style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>16</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>3.7% of total</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6 — TEAM WORKLOAD TABLE */}
      <div className="report-card-box">
        <div className="report-card-header">
          <div>
            <span className="report-card-title">Team Workload</span>
            <div className="report-card-subtitle">Support team ticket allocation and SLA metrics</div>
          </div>
        </div>

        <Table
          columns={teamColumns}
          data={teamWorkloadList}
          keyExtractor={t => t.teamId}
          onRowClick={item => onNavigateToTeamDetail(item.teamId)}
        />
      </div>

      {/* SECTION 8 — TOP REQUEST TYPES TABLE */}
      <div className="report-card-box">
        <div className="report-card-header">
          <div>
            <span className="report-card-title">Top Request Types</span>
            <div className="report-card-subtitle">Most frequent employee request categories</div>
          </div>
        </div>

        <Table
          columns={requestTypeColumns}
          data={topRequestTypesList}
          keyExtractor={tr => tr.id}
          onRowClick={item => onNavigateToAllTicketsWithCategoryFilter(item.category)}
        />
      </div>
    </div>
  );
};
