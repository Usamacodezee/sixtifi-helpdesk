import { HELPDESK_COMPANIES } from './companies';

export type VolumeRangeDays = 7 | 15 | 30;

export interface CategoryStatusBreakdown {
  category: string;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface TeamPerformance {
  teamId: string;
  teamName: string;
  openTickets: number;
  resolvedCount: number;
  slaAtRisk: number;
  avgResolutionHours: number;
}

export interface SlaAttentionItem {
  id: string;
  subject: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  remainingTime: string;
  category: string;
  type: 'at-risk' | 'breached' | 'due-today';
}

export interface VolumeDayPoint {
  day: string;
  created: number;
  resolved: number;
}

export interface ActivityItem {
  id: string;
  text: string;
  time: string;
  tone: 'info' | 'success' | 'warning';
}

export interface OpenResolveRatioItem {
  label: string;
  open: number;
  resolved: number;
}

export interface CompanyDashboardMetrics {
  companyId: string;
  open: number;
  inProgress: number;
  dueToday: number;
  slaAtRisk: number;
  resolvedToday: number;
  avgFirstResponseHrs: number;
  slaCompliancePercent: number;
  categories: CategoryStatusBreakdown[];
  teams: TeamPerformance[];
  slaItems: SlaAttentionItem[];
  /** Full 30-day series; UI slices to 7 / 15 / 30 */
  volumeSeries: VolumeDayPoint[];
  recentActivity: ActivityItem[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Deterministic mock series so charts feel stable per company. */
function buildVolumeSeries(seed: number, days = 30): VolumeDayPoint[] {
  const points: VolumeDayPoint[] = [];
  const today = new Date(2026, 7, 27); // Aug 27, 2026 (demo date)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const n = (seed * 17 + i * 13) % 11;
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const created = weekend ? 3 + (n % 5) : 10 + n + (seed % 6);
    const resolved = Math.max(2, created - 2 + ((n + seed) % 5) - 1);
    points.push({
      day: days <= 7 ? WEEKDAYS[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`,
      created,
      resolved
    });
  }
  return points;
}

const ACME: CompanyDashboardMetrics = {
  companyId: 'co-acme',
  open: 42,
  inProgress: 17,
  dueToday: 9,
  slaAtRisk: 5,
  resolvedToday: 14,
  avgFirstResponseHrs: 1.8,
  slaCompliancePercent: 92,
  categories: [
    { category: 'Attendance', open: 6, inProgress: 5, resolved: 18, closed: 4 },
    { category: 'Leave', open: 4, inProgress: 3, resolved: 12, closed: 2 },
    { category: 'Payroll', open: 5, inProgress: 4, resolved: 15, closed: 3 },
    { category: 'HR', open: 3, inProgress: 2, resolved: 9, closed: 1 },
    { category: 'IT', open: 7, inProgress: 5, resolved: 14, closed: 2 },
    { category: 'Administration', open: 2, inProgress: 1, resolved: 6, closed: 1 }
  ],
  teams: [
    { teamId: 'team-hr', teamName: 'HR Support', openTickets: 18, resolvedCount: 86, slaAtRisk: 3, avgResolutionHours: 16 },
    { teamId: 'team-payroll', teamName: 'Payroll Support', openTickets: 12, resolvedCount: 64, slaAtRisk: 4, avgResolutionHours: 22 },
    { teamId: 'team-it', teamName: 'IT Support', openTickets: 10, resolvedCount: 52, slaAtRisk: 2, avgResolutionHours: 9 },
    { teamId: 'team-admin', teamName: 'Administration Support', openTickets: 8, resolvedCount: 31, slaAtRisk: 1, avgResolutionHours: 11 }
  ],
  slaItems: [
    { id: 'TKT-4088', subject: 'Payroll deduction clarification', priority: 'Urgent', remainingTime: '15m remaining', category: 'Payroll', type: 'at-risk' },
    { id: 'TKT-4089', subject: 'Missing attendance punch for Aug 17', priority: 'High', remainingTime: '1h 45m remaining', category: 'Attendance', type: 'at-risk' },
    { id: 'TKT-4081', subject: 'Performance bonus payout delay', priority: 'Urgent', remainingTime: '24m overdue', category: 'Payroll', type: 'breached' },
    { id: 'TKT-4087', subject: 'Attendance regularization request', priority: 'Medium', remainingTime: '5h remaining', category: 'Attendance', type: 'due-today' },
    { id: 'TKT-4086', subject: 'New employee hardware request', priority: 'Medium', remainingTime: '6h remaining', category: 'IT', type: 'due-today' }
  ],
  volumeSeries: buildVolumeSeries(3),
  recentActivity: [
    { id: 'a1', text: 'Rahul Sharma resolved TKT-4082 (Leave balance)', time: '12 min ago', tone: 'success' },
    { id: 'a2', text: 'TKT-4088 marked SLA at risk — Payroll', time: '28 min ago', tone: 'warning' },
    { id: 'a3', text: 'Priya Shah assigned TKT-4086 to IT Support', time: '1h ago', tone: 'info' },
    { id: 'a4', text: 'New request TKT-4091 raised under Attendance', time: '2h ago', tone: 'info' }
  ]
};

const NORTHWIND: CompanyDashboardMetrics = {
  companyId: 'co-northwind',
  open: 19,
  inProgress: 8,
  dueToday: 4,
  slaAtRisk: 2,
  resolvedToday: 7,
  avgFirstResponseHrs: 2.4,
  slaCompliancePercent: 88,
  categories: [
    { category: 'Fleet Support', open: 5, inProgress: 3, resolved: 11, closed: 2 },
    { category: 'Warehouse Ops', open: 4, inProgress: 2, resolved: 8, closed: 1 },
    { category: 'IT', open: 3, inProgress: 2, resolved: 6, closed: 1 }
  ],
  teams: [
    { teamId: 'team-nw-ops', teamName: 'Northwind Ops Desk', openTickets: 11, resolvedCount: 28, slaAtRisk: 2, avgResolutionHours: 14 },
    { teamId: 'team-it', teamName: 'IT Support', openTickets: 8, resolvedCount: 19, slaAtRisk: 1, avgResolutionHours: 10 }
  ],
  slaItems: [
    { id: 'TKT-5102', subject: 'Fleet GPS offline — truck 14', priority: 'High', remainingTime: '40m remaining', category: 'Fleet Support', type: 'at-risk' },
    { id: 'TKT-5098', subject: 'Warehouse scanner sync failure', priority: 'Urgent', remainingTime: '12m overdue', category: 'Warehouse Ops', type: 'breached' },
    { id: 'TKT-5100', subject: 'Dock door access badge', priority: 'Medium', remainingTime: '3h remaining', category: 'Warehouse Ops', type: 'due-today' }
  ],
  volumeSeries: buildVolumeSeries(7),
  recentActivity: [
    { id: 'n1', text: 'TKT-5098 breached SLA — Warehouse Ops', time: '18 min ago', tone: 'warning' },
    { id: 'n2', text: 'Ops Desk picked up TKT-5102', time: '45 min ago', tone: 'info' },
    { id: 'n3', text: 'Resolved TKT-5088 (Route planner sync)', time: '3h ago', tone: 'success' }
  ]
};

const CONTOSO: CompanyDashboardMetrics = {
  companyId: 'co-contoso',
  open: 11,
  inProgress: 5,
  dueToday: 3,
  slaAtRisk: 1,
  resolvedToday: 5,
  avgFirstResponseHrs: 1.2,
  slaCompliancePercent: 95,
  categories: [
    { category: 'Store Operations', open: 4, inProgress: 2, resolved: 9, closed: 1 },
    { category: 'Retail HR', open: 3, inProgress: 2, resolved: 7, closed: 2 }
  ],
  teams: [
    { teamId: 'team-contoso-hr', teamName: 'Contoso People Ops', openTickets: 7, resolvedCount: 22, slaAtRisk: 1, avgResolutionHours: 12 },
    { teamId: 'team-admin', teamName: 'Administration Support', openTickets: 4, resolvedCount: 14, slaAtRisk: 0, avgResolutionHours: 8 }
  ],
  slaItems: [
    { id: 'TKT-6201', subject: 'POS till mismatch — Store 08', priority: 'High', remainingTime: '55m remaining', category: 'Store Operations', type: 'at-risk' },
    { id: 'TKT-6195', subject: 'Part-time shift swap approval', priority: 'Low', remainingTime: '4h remaining', category: 'Retail HR', type: 'due-today' }
  ],
  volumeSeries: buildVolumeSeries(5),
  recentActivity: [
    { id: 'c1', text: 'People Ops replied on TKT-6195', time: '25 min ago', tone: 'info' },
    { id: 'c2', text: 'Store 08 escalated TKT-6201', time: '50 min ago', tone: 'warning' },
    { id: 'c3', text: 'Closed TKT-6180 (Gift card balance)', time: '4h ago', tone: 'success' }
  ]
};

const BY_COMPANY: Record<string, CompanyDashboardMetrics> = {
  'co-acme': ACME,
  'co-northwind': NORTHWIND,
  'co-contoso': CONTOSO
};

export function getDashboardMetrics(companyId: string): CompanyDashboardMetrics {
  return BY_COMPANY[companyId] || ACME;
}

export function getVolumeTrend(companyId: string, days: VolumeRangeDays): VolumeDayPoint[] {
  const series = getDashboardMetrics(companyId).volumeSeries;
  const slice = series.slice(-days);
  if (days === 7) {
    return slice.map((p, i) => {
      const d = new Date(2026, 7, 27);
      d.setDate(d.getDate() - (days - 1 - i));
      return { ...p, day: WEEKDAYS[d.getDay()] };
    });
  }
  return slice;
}

export function getOpenResolveRatio(companyId: string): OpenResolveRatioItem[] {
  const metrics = getDashboardMetrics(companyId);
  return metrics.categories.map(c => ({
    label: c.category,
    open: c.open + c.inProgress,
    resolved: c.resolved
  }));
}

export function categoryTotal(c: CategoryStatusBreakdown): number {
  return c.open + c.inProgress + c.resolved + c.closed;
}

export function dashboardCompanyOptions() {
  return HELPDESK_COMPANIES;
}
