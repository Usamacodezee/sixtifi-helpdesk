import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { PriorityBadge } from '../components/ui/Badge';
import { SelectInput } from '../components/ui/FormControls';
import {
  Ticket,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Plus,
  ArrowRight,
  Clock,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react';
import { HELPDESK_COMPANIES, getCompanyById } from '../data/companies';
import {
  categoryTotal,
  getDashboardMetrics,
  getOpenResolveRatio,
  getVolumeTrend,
  CategoryStatusBreakdown,
  TeamPerformance,
  VolumeRangeDays
} from '../data/dashboardMetrics';
import './DashboardView.css';

export interface DashboardViewProps {
  companyId: string;
  onCompanyChange: (companyId: string) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
  onOpenCreateDrawer: () => void;
  onNavigateToAllTickets: () => void;
  onNavigateToAllTicketsWithCategoryFilter?: (categoryName: string) => void;
  onNavigateToTeamDetail?: (teamId: string) => void;
}

const STATUS_COLORS = {
  open: '#3B82F6',
  inProgress: '#F59E0B',
  resolved: '#10B981',
  closed: '#94A3B8'
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  companyId,
  onCompanyChange,
  onOpenCreateDrawer,
  onNavigateToAllTickets,
  onNavigateToAllTicketsWithCategoryFilter,
  onNavigateToTeamDetail
}) => {
  const [categoryChartFilter, setCategoryChartFilter] = useState('all');
  const [teamChartFilter, setTeamChartFilter] = useState('all');
  const [volumeRange, setVolumeRange] = useState<VolumeRangeDays>(7);
  const [selectedSlaTab, setSelectedSlaTab] = useState<'at-risk' | 'breached' | 'due-today'>('at-risk');

  const company = getCompanyById(companyId);
  const metrics = useMemo(() => getDashboardMetrics(companyId), [companyId]);
  const volumeTrend = useMemo(() => getVolumeTrend(companyId, volumeRange), [companyId, volumeRange]);
  const openResolveRatio = useMemo(() => getOpenResolveRatio(companyId), [companyId]);

  React.useEffect(() => {
    setCategoryChartFilter('all');
    setTeamChartFilter('all');
    setVolumeRange(7);
  }, [companyId]);

  const goToCategory = (categoryName: string) => {
    if (onNavigateToAllTicketsWithCategoryFilter) onNavigateToAllTicketsWithCategoryFilter(categoryName);
    else onNavigateToAllTickets();
  };

  const selectedCategory: CategoryStatusBreakdown | null =
    categoryChartFilter === 'all'
      ? null
      : metrics.categories.find(c => c.category === categoryChartFilter) || null;

  const selectedTeam: TeamPerformance | null =
    teamChartFilter === 'all'
      ? null
      : metrics.teams.find(t => t.teamId === teamChartFilter) || null;

  const filteredSlaItems = metrics.slaItems.filter(item => item.type === selectedSlaTab);

  const volumeMax = Math.max(...volumeTrend.flatMap(d => [d.created, d.resolved]), 1);

  const overallOpen = openResolveRatio.reduce((s, r) => s + r.open, 0);
  const overallResolved = openResolveRatio.reduce((s, r) => s + r.resolved, 0);
  const overallRatio = overallResolved === 0 ? overallOpen : overallOpen / overallResolved;

  const renderCategoryAllChart = () => {
    const max = Math.max(...metrics.categories.map(categoryTotal), 1);
    return (
      <div className="dash-dynamic-chart">
        {metrics.categories.map(cat => {
          const total = categoryTotal(cat);
          return (
            <button
              key={cat.category}
              type="button"
              className="dash-stack-row"
              onClick={() => goToCategory(cat.category)}
            >
              <div className="dash-stack-meta">
                <span className="dash-stack-label">{cat.category}</span>
                <span className="dash-stack-total">{total}</span>
              </div>
              <div className="dash-stack-track">
                <div className="dash-stack-fill" style={{ width: `${(total / max) * 100}%` }}>
                  <span style={{ flex: cat.open || 0.0001, background: STATUS_COLORS.open }} title={`Open ${cat.open}`} />
                  <span style={{ flex: cat.inProgress || 0.0001, background: STATUS_COLORS.inProgress }} title={`In Progress ${cat.inProgress}`} />
                  <span style={{ flex: cat.resolved || 0.0001, background: STATUS_COLORS.resolved }} title={`Resolved ${cat.resolved}`} />
                  <span style={{ flex: cat.closed || 0.0001, background: STATUS_COLORS.closed }} title={`Closed ${cat.closed}`} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderCategoryDetailChart = (cat: CategoryStatusBreakdown) => {
    const rows = [
      { label: 'Open', value: cat.open, color: STATUS_COLORS.open },
      { label: 'In Progress', value: cat.inProgress, color: STATUS_COLORS.inProgress },
      { label: 'Resolved', value: cat.resolved, color: STATUS_COLORS.resolved },
      { label: 'Closed', value: cat.closed, color: STATUS_COLORS.closed }
    ];
    const max = Math.max(...rows.map(r => r.value), 1);
    return (
      <div className="dash-dynamic-chart">
        {rows.map(row => (
          <div key={row.label} className="dash-bar-row">
            <div className="dash-bar-meta">
              <span className="dash-stack-label">{row.label}</span>
              <span className="dash-stack-total">{row.value}</span>
            </div>
            <div className="dash-stack-track">
              <div
                className="dash-single-fill"
                style={{ width: `${(row.value / max) * 100}%`, background: row.color }}
              />
            </div>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          rightIcon={<ArrowRight size={14} />}
          onClick={() => goToCategory(cat.category)}
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
        >
          View {cat.category} tickets
        </Button>
      </div>
    );
  };

  const renderTeamAllChart = () => {
    const max = Math.max(...metrics.teams.map(t => t.openTickets + t.resolvedCount), 1);
    return (
      <div className="dash-dynamic-chart">
        {metrics.teams.map(team => {
          const total = team.openTickets + team.resolvedCount;
          return (
            <button
              key={team.teamId}
              type="button"
              className="dash-stack-row"
              onClick={() => onNavigateToTeamDetail?.(team.teamId)}
            >
              <div className="dash-stack-meta">
                <span className="dash-stack-label">{team.teamName}</span>
                <span className="dash-stack-total">{team.openTickets} open · {team.slaAtRisk} at risk</span>
              </div>
              <div className="dash-stack-track">
                <div className="dash-stack-fill" style={{ width: `${(total / max) * 100}%` }}>
                  <span style={{ flex: team.openTickets || 0.0001, background: STATUS_COLORS.open }} title={`Open ${team.openTickets}`} />
                  <span style={{ flex: team.resolvedCount || 0.0001, background: STATUS_COLORS.resolved }} title={`Resolved ${team.resolvedCount}`} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderTeamDetail = (team: TeamPerformance) => {
    const rows = [
      { label: 'Open tickets', value: team.openTickets, color: STATUS_COLORS.open },
      { label: 'Resolved', value: team.resolvedCount, color: STATUS_COLORS.resolved },
      { label: 'SLA at risk', value: team.slaAtRisk, color: '#EF4444' },
      { label: 'Avg resolution (hrs)', value: team.avgResolutionHours, color: '#8B5CF6' }
    ];
    const max = Math.max(...rows.map(r => r.value), 1);
    return (
      <div className="dash-dynamic-chart">
        {rows.map(row => (
          <div key={row.label} className="dash-bar-row">
            <div className="dash-bar-meta">
              <span className="dash-stack-label">{row.label}</span>
              <span className="dash-stack-total">{row.value}</span>
            </div>
            <div className="dash-stack-track">
              <div
                className="dash-single-fill"
                style={{ width: `${(row.value / max) * 100}%`, background: row.color }}
              />
            </div>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          rightIcon={<ArrowRight size={14} />}
          onClick={() => onNavigateToTeamDetail?.(team.teamId)}
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
        >
          View {team.teamName}
        </Button>
      </div>
    );
  };

  return (
    <div className="dashboard-container dash-modern">
      <PageHeader
        breadcrumbs={[{ label: 'Sixtifi WFM' }, { label: 'Helpdesk' }, { label: 'Dashboard' }]}
        title="Helpdesk Dashboard"
        subtitle={`Live operations for ${company.name}`}
        actions={
          <div className="dash-header-actions">
            <div className="dash-company-select">
              <SelectInput
                value={companyId}
                onChange={e => onCompanyChange(e.target.value)}
                aria-label="Company"
              >
                {HELPDESK_COMPANIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </div>
            <Button variant="primary" leftIcon={<Plus size={16} />} onClick={onOpenCreateDrawer}>
              Create Ticket
            </Button>
          </div>
        }
      />

      <div className="dash-hero-strip">
        <div>
          <span className="dash-hero-eyebrow">Company workspace</span>
          <h2 className="dash-hero-title">{company.name}</h2>
        </div>
        <div className="dash-hero-pills">
          <span className="dash-pill">SLA {metrics.slaCompliancePercent}%</span>
          <span className="dash-pill">Avg response {metrics.avgFirstResponseHrs}h</span>
          <span className="dash-pill is-accent">{metrics.open} open</span>
        </div>
      </div>

      <div className="dashboard-kpi-grid dash-kpi-six">
        <button type="button" className="dashboard-kpi-card is-blue" onClick={onNavigateToAllTickets}>
          <div className="kpi-header">
            <span className="kpi-title">Open</span>
            <span className="kpi-icon-wrap"><Ticket size={15} /></span>
          </div>
          <div className="kpi-value">{metrics.open}</div>
          <span className="kpi-foot">Active backlog</span>
        </button>
        <button type="button" className="dashboard-kpi-card is-amber" onClick={onNavigateToAllTickets}>
          <div className="kpi-header">
            <span className="kpi-title">Unassigned</span>
            <span className="kpi-icon-wrap"><Inbox size={15} /></span>
          </div>
          <div className="kpi-value">{metrics.unassigned}</div>
          <span className="kpi-foot">Needs routing</span>
        </button>
        <button type="button" className="dashboard-kpi-card is-sky" onClick={onNavigateToAllTickets}>
          <div className="kpi-header">
            <span className="kpi-title">In Progress</span>
            <span className="kpi-icon-wrap"><Clock size={15} /></span>
          </div>
          <div className="kpi-value">{metrics.inProgress}</div>
          <span className="kpi-foot">Being worked</span>
        </button>
        <button type="button" className="dashboard-kpi-card is-violet" onClick={onNavigateToAllTickets}>
          <div className="kpi-header">
            <span className="kpi-title">Due Today</span>
            <span className="kpi-icon-wrap"><Calendar size={15} /></span>
          </div>
          <div className="kpi-value">{metrics.dueToday}</div>
          <span className="kpi-foot">Same-day target</span>
        </button>
        <button type="button" className="dashboard-kpi-card is-rose" onClick={onNavigateToAllTickets}>
          <div className="kpi-header">
            <span className="kpi-title">SLA At Risk</span>
            <span className="kpi-icon-wrap"><AlertTriangle size={15} /></span>
          </div>
          <div className="kpi-value">{metrics.slaAtRisk}</div>
          <span className="kpi-foot">Act soon</span>
        </button>
        <button type="button" className="dashboard-kpi-card is-emerald" onClick={onNavigateToAllTickets}>
          <div className="kpi-header">
            <span className="kpi-title">Resolved Today</span>
            <span className="kpi-icon-wrap"><CheckCircle2 size={15} /></span>
          </div>
          <div className="kpi-value">{metrics.resolvedToday}</div>
          <span className="kpi-foot">Closed out</span>
        </button>
      </div>

      {/* Volume + Open-to-resolve ratio */}
      <div className="dashboard-two-col">
        <div className="dashboard-card">
          <div className="dash-card-toolbar">
            <div>
              <h3 className="card-title">Ticket volume</h3>
              <p className="card-subtitle">Created vs resolved for {company.shortName}</p>
            </div>
            <div className="dash-volume-controls">
              <div className="dash-inline-stats">
                <span><TrendingUp size={13} /> Avg first response {metrics.avgFirstResponseHrs}h</span>
              </div>
              <div style={{ width: 110 }}>
                <SelectInput
                  value={String(volumeRange)}
                  onChange={e => setVolumeRange(Number(e.target.value) as VolumeRangeDays)}
                  aria-label="Volume range"
                >
                  <option value="7">7 days</option>
                  <option value="15">15 days</option>
                  <option value="30">30 days</option>
                </SelectInput>
              </div>
            </div>
          </div>
          <div className="dash-legend">
            <span><i style={{ background: '#6366F1' }} /> Created</span>
            <span><i style={{ background: '#10B981' }} /> Resolved</span>
          </div>
          <div className={`dash-volume-chart is-range-${volumeRange}`}>
            {volumeTrend.map((day, idx) => (
              <div key={`${day.day}-${idx}`} className="dash-volume-col">
                <div className="dash-volume-bars">
                  <div
                    className="dash-volume-bar created"
                    style={{ height: `${(day.created / volumeMax) * 100}%` }}
                    title={`Created ${day.created}`}
                  />
                  <div
                    className="dash-volume-bar resolved"
                    style={{ height: `${(day.resolved / volumeMax) * 100}%` }}
                    title={`Resolved ${day.resolved}`}
                  />
                </div>
                <span className="dash-volume-day">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dash-card-toolbar">
            <div>
              <h3 className="card-title">Open to resolve ratio</h3>
              <p className="card-subtitle">Open (incl. in progress) vs resolved by category</p>
            </div>
            <div className="dash-ratio-summary">
              <span className="dash-ratio-value">{overallRatio.toFixed(2)}</span>
              <span className="dash-ratio-caption">overall open : resolve</span>
            </div>
          </div>
          <div className="dash-legend">
            <span><i style={{ background: STATUS_COLORS.open }} /> Open</span>
            <span><i style={{ background: STATUS_COLORS.resolved }} /> Resolved</span>
          </div>
          {(() => {
            const n = openResolveRatio.length;
            const chartW = 600;
            const chartH = 200;
            const padL = 28;
            const padR = 16;
            const padT = 16;
            const padB = 36;
            const plotW = chartW - padL - padR;
            const plotH = chartH - padT - padB;
            const yMax = Math.max(...openResolveRatio.flatMap(r => [r.open, r.resolved]), 1);
            const xAt = (i: number) =>
              n <= 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW;
            const yAt = (v: number) => padT + plotH - (v / yMax) * plotH;
            const openPoints = openResolveRatio.map((r, i) => `${xAt(i)},${yAt(r.open)}`).join(' ');
            const resolvedPoints = openResolveRatio.map((r, i) => `${xAt(i)},${yAt(r.resolved)}`).join(' ');
            const gridSteps = 4;

            return (
              <div className="dash-ratio-line-wrap">
                <svg
                  className="dash-ratio-line-svg"
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  role="img"
                  aria-label="Open vs resolved line chart by category"
                >
                  {Array.from({ length: gridSteps + 1 }, (_, i) => {
                    const y = padT + (plotH / gridSteps) * i;
                    const val = Math.round(yMax - (yMax / gridSteps) * i);
                    return (
                      <g key={i}>
                        <line
                          x1={padL}
                          y1={y}
                          x2={chartW - padR}
                          y2={y}
                          className="dash-ratio-grid"
                        />
                        <text x={padL - 6} y={y + 3} className="dash-ratio-axis-label" textAnchor="end">
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  <polyline
                    points={openPoints}
                    fill="none"
                    stroke={STATUS_COLORS.open}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <polyline
                    points={resolvedPoints}
                    fill="none"
                    stroke={STATUS_COLORS.resolved}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />

                  {openResolveRatio.map((row, i) => {
                    const ratio = row.resolved === 0 ? row.open : row.open / row.resolved;
                    return (
                      <g key={row.label}>
                        <circle
                          cx={xAt(i)}
                          cy={yAt(row.open)}
                          r="4.5"
                          fill={STATUS_COLORS.open}
                          className="dash-ratio-dot"
                          onClick={() => goToCategory(row.label)}
                        >
                          <title>{`${row.label}: ${row.open} open (${ratio.toFixed(2)}×)`}</title>
                        </circle>
                        <circle
                          cx={xAt(i)}
                          cy={yAt(row.resolved)}
                          r="4.5"
                          fill={STATUS_COLORS.resolved}
                          className="dash-ratio-dot"
                          onClick={() => goToCategory(row.label)}
                        >
                          <title>{`${row.label}: ${row.resolved} resolved`}</title>
                        </circle>
                        <text
                          x={xAt(i)}
                          y={chartH - 10}
                          className="dash-ratio-x-label"
                          textAnchor="middle"
                        >
                          {row.label.length > 10 ? `${row.label.slice(0, 9)}…` : row.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="dashboard-two-col">
        <div className="dashboard-card">
          <div className="dash-card-toolbar">
            <div>
              <h3 className="card-title">Category-wise ticket statuses</h3>
              <p className="card-subtitle">
                {selectedCategory
                  ? `Status mix for ${selectedCategory.category}`
                  : 'Stacked status mix across categories'}
              </p>
            </div>
            <div style={{ width: 180 }}>
              <SelectInput
                value={categoryChartFilter}
                onChange={e => setCategoryChartFilter(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {metrics.categories.map(c => (
                  <option key={c.category} value={c.category}>
                    {c.category}
                  </option>
                ))}
              </SelectInput>
            </div>
          </div>
          <div className="dash-legend">
            <span><i style={{ background: STATUS_COLORS.open }} /> Open</span>
            <span><i style={{ background: STATUS_COLORS.inProgress }} /> In Progress</span>
            <span><i style={{ background: STATUS_COLORS.resolved }} /> Resolved</span>
            <span><i style={{ background: STATUS_COLORS.closed }} /> Closed</span>
          </div>
          {selectedCategory ? renderCategoryDetailChart(selectedCategory) : renderCategoryAllChart()}
        </div>

        <div className="dashboard-card">
          <div className="dash-card-toolbar">
            <div>
              <h3 className="card-title">Team-wise performance</h3>
              <p className="card-subtitle">
                {selectedTeam
                  ? `Workload for ${selectedTeam.teamName}`
                  : 'Open vs resolved across teams'}
              </p>
            </div>
            <div style={{ width: 200 }}>
              <SelectInput
                value={teamChartFilter}
                onChange={e => setTeamChartFilter(e.target.value)}
                aria-label="Filter by team"
              >
                <option value="all">All teams</option>
                {metrics.teams.map(t => (
                  <option key={t.teamId} value={t.teamId}>
                    {t.teamName}
                  </option>
                ))}
              </SelectInput>
            </div>
          </div>
          <div className="dash-legend">
            <span><i style={{ background: STATUS_COLORS.open }} /> Open</span>
            <span><i style={{ background: STATUS_COLORS.resolved }} /> Resolved</span>
          </div>
          {selectedTeam ? renderTeamDetail(selectedTeam) : renderTeamAllChart()}
        </div>
      </div>

      <div className="dashboard-two-col">
        <div className="dashboard-card">
          <div className="dash-card-toolbar">
            <div>
              <h3 className="card-title">Recent activity</h3>
              <p className="card-subtitle">Latest movements in this company</p>
            </div>
            <Activity size={16} style={{ color: 'var(--color-primary-600)' }} />
          </div>
          <div className="dash-activity-list">
            {metrics.recentActivity.map(item => (
              <div key={item.id} className={`dash-activity-item is-${item.tone}`}>
                <span className="dash-activity-dot" />
                <div>
                  <div className="dash-activity-text">{item.text}</div>
                  <div className="dash-activity-time">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="sla-section-header">
            <div>
              <h3 className="card-title">SLA attention required</h3>
              <p className="card-subtitle">Tickets needing action for {company.shortName}</p>
            </div>
            <div className="sla-tabs">
              {([
                { id: 'at-risk' as const, label: 'At Risk' },
                { id: 'breached' as const, label: 'Breached' },
                { id: 'due-today' as const, label: 'Due Today' }
              ]).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={`sla-tab ${selectedSlaTab === tab.id ? 'is-active' : ''}`}
                  onClick={() => setSelectedSlaTab(tab.id)}
                >
                  {tab.label}
                  <span className="sla-tab-count">
                    {metrics.slaItems.filter(i => i.type === tab.id).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="sla-list">
            {filteredSlaItems.length === 0 ? (
              <div className="sla-empty">No tickets in this queue for {company.name}.</div>
            ) : (
              filteredSlaItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className="sla-list-item"
                  onClick={onNavigateToAllTickets}
                >
                  <div className="sla-item-main">
                    <span className="sla-item-id">{item.id}</span>
                    <span className="sla-item-subject">{item.subject}</span>
                    <span className="sla-item-category">{item.category}</span>
                  </div>
                  <div className="sla-item-side">
                    <PriorityBadge priority={item.priority} />
                    <span className={`sla-item-time is-${item.type}`}>{item.remainingTime}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
