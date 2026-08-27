import { DEFAULT_COMPANY_ID } from './companies';

export type SlaHoursMode = '24-hour' | 'shift-hours' | 'custom-hours';

export interface CompanyGeneralSettings {
  ticketPrefix: string;
  autoCloseDays: string;
  allowReopenDays: string;
  slaHoursMode: SlaHoursMode;
  enableAutoAssignment: boolean;
  assignmentAlgorithm: string;
}

const STORAGE_KEY = 'sixtifi-helpdesk-general-settings-by-company';

export const GENERAL_SETTINGS_UPDATED_EVENT = 'sixtifi-general-settings-updated';
export const SLA_HOURS_UPDATED_EVENT = 'sixtifi-sla-hours-mode-updated';

const DEFAULTS: CompanyGeneralSettings = {
  ticketPrefix: 'TKT-',
  autoCloseDays: '7',
  allowReopenDays: '14',
  slaHoursMode: 'shift-hours',
  enableAutoAssignment: true,
  assignmentAlgorithm: 'Round Robin (Load Balanced)'
};

/** Per-company demo defaults (prefixes differ so company scope is obvious). */
const SEED: Record<string, Partial<CompanyGeneralSettings>> = {
  'co-acme': { ticketPrefix: 'TKT-', assignmentAlgorithm: 'Round Robin (Load Balanced)' },
  'co-northwind': { ticketPrefix: 'NW-', assignmentAlgorithm: 'Lowest Active Workload' },
  'co-contoso': { ticketPrefix: 'CT-', assignmentAlgorithm: 'Category Specialist Preferred' }
};

function readAll(): Record<string, CompanyGeneralSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, CompanyGeneralSettings>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getGeneralSettings(companyId: string = DEFAULT_COMPANY_ID): CompanyGeneralSettings {
  const all = readAll();
  const stored = all[companyId];
  const seed = SEED[companyId] || {};
  return {
    ...DEFAULTS,
    ...seed,
    ...(stored || {})
  };
}

export function saveGeneralSettings(companyId: string, settings: CompanyGeneralSettings): void {
  const all = readAll();
  all[companyId] = { ...settings };
  writeAll(all);
  window.dispatchEvent(
    new CustomEvent(GENERAL_SETTINGS_UPDATED_EVENT, { detail: { companyId } })
  );
  window.dispatchEvent(
    new CustomEvent(SLA_HOURS_UPDATED_EVENT, { detail: { companyId, mode: settings.slaHoursMode } })
  );
}
