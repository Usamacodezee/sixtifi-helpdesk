export type CategoryAudience = 'all' | 'employees' | 'groups';
export type TicketPriorityLevel = 'Urgent' | 'High' | 'Medium' | 'Low';
export type SlaTimeUnit = 'Minutes' | 'Hours' | 'Days';
export type CategoryBusinessHoursMode = 'shift-hours' | '24-hour';
export type NotificationChannel = 'in-app' | 'email' | 'both';

export interface CategoryAssignee {
  id: string;
  name: string;
  type: 'employee' | 'role';
  initials: string;
}

export interface PrioritySlaConfig {
  enabled: boolean;
  firstResponseValue: number;
  firstResponseUnit: SlaTimeUnit;
  resolutionValue: number;
  resolutionUnit: SlaTimeUnit;
}

/** Per-category notification rules (company-scoped via the parent category). */
export interface CategoryNotificationRules {
  enabled: boolean;
  channel: NotificationChannel;
  /** Fixed on when enabled — request submitted */
  notifyEmpOnCreate: boolean;
  /** Fixed on when enabled — someone replies */
  notifyEmpOnReply: boolean;
  /** Fixed on when enabled — request resolved */
  notifyEmpOnResolve: boolean;
  /** Fixed on when enabled — ticket assigned */
  notifyAgentOnAssign: boolean;
}

export interface CategoryAudienceConfig {
  type: CategoryAudience;
  /** Selected employee ids when type === 'employees' */
  employeeIds: string[];
  /** Selected group ids when type === 'groups' */
  groupIds: string[];
}

export interface HelpdeskCategory {
  id: string;
  companyId: string;
  name: string;
  description: string;
  totalTickets: number;
  openTickets: number;
  assignedTeam: string;
  status: 'Active' | 'Inactive';
  lastUpdated: string;
  audience: CategoryAudienceConfig;
  businessHours: CategoryBusinessHoursMode;
  enableOnHold: boolean;
  allowEmployeeReopen: boolean;
  priorityChangeBy: {
    assignee: boolean;
    employee: boolean;
  };
  categoryAssignees: CategoryAssignee[];
  addAssigneesAsFollowers: boolean;
  prioritisationEnabled: boolean;
  /**
   * When true, SLA Escalation is off for this category. Priority and reply/resolve
   * targets still apply; escalation notifications do not fire.
   */
  slaExempt: boolean;
  /** Used when prioritisationEnabled is false — single SLA for all tickets in the category */
  categorySla: PrioritySlaConfig;
  prioritySla: Record<TicketPriorityLevel, PrioritySlaConfig>;
  defaultPriority: TicketPriorityLevel;
  escalateOnResponseBreach: boolean;
  escalateOnResolutionBreach: boolean;
  notifications: CategoryNotificationRules;
}

export const PRIORITY_LEVELS: TicketPriorityLevel[] = ['Urgent', 'High', 'Medium', 'Low'];

export const DEFAULT_PRIORITY_SLA: Record<TicketPriorityLevel, PrioritySlaConfig> = {
  Urgent: {
    enabled: true,
    firstResponseValue: 1,
    firstResponseUnit: 'Hours',
    resolutionValue: 4,
    resolutionUnit: 'Hours'
  },
  High: {
    enabled: true,
    firstResponseValue: 4,
    firstResponseUnit: 'Hours',
    resolutionValue: 1,
    resolutionUnit: 'Days'
  },
  Medium: {
    enabled: true,
    firstResponseValue: 8,
    firstResponseUnit: 'Hours',
    resolutionValue: 2,
    resolutionUnit: 'Days'
  },
  Low: {
    enabled: true,
    firstResponseValue: 12,
    firstResponseUnit: 'Hours',
    resolutionValue: 4,
    resolutionUnit: 'Days'
  }
};

/** Flat SLA when ticket prioritisation is disabled for a category */
export const DEFAULT_CATEGORY_SLA: PrioritySlaConfig = {
  enabled: true,
  firstResponseValue: 8,
  firstResponseUnit: 'Hours',
  resolutionValue: 2,
  resolutionUnit: 'Days'
};

export const DEFAULT_CATEGORY_NOTIFICATIONS: CategoryNotificationRules = {
  enabled: true,
  channel: 'both',
  notifyEmpOnCreate: true,
  notifyEmpOnReply: true,
  notifyEmpOnResolve: true,
  notifyAgentOnAssign: true
};

export const CATEGORY_BUSINESS_HOURS_OPTIONS: Array<{
  value: CategoryBusinessHoursMode;
  label: string;
  description: string;
}> = [
  {
    value: 'shift-hours',
    label: 'Working hours only',
    description: 'SLA clock pauses outside the assigned agent’s working hours.'
  },
  {
    value: '24-hour',
    label: 'Full day (24 hour)',
    description: 'SLA clock runs continuously, including nights and weekends.'
  }
];

export const businessHoursLabel = (mode: CategoryBusinessHoursMode): string =>
  CATEGORY_BUSINESS_HOURS_OPTIONS.find(o => o.value === mode)?.label || mode;

export const notificationChannelLabel = (channel: NotificationChannel): string => {
  if (channel === 'in-app') return 'In-app only';
  if (channel === 'email') return 'Email only';
  return 'In-app and email';
};

export const audienceLabel = (audience: CategoryAudienceConfig): string => {
  if (audience.type === 'all') return 'Everyone in this company';
  if (audience.type === 'employees') {
    const n = audience.employeeIds.length;
    return n === 0 ? 'Selected employees (none yet)' : `${n} selected employee${n === 1 ? '' : 's'}`;
  }
  const n = audience.groupIds.length;
  return n === 0 ? 'Selected groups (none yet)' : `${n} selected group${n === 1 ? '' : 's'}`;
};
