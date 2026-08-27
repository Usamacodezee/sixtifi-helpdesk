/** SLA clock consideration labels — values are stored per company in general settings. */

import { DEFAULT_COMPANY_ID } from './companies';
import {
  getGeneralSettings,
  SlaHoursMode,
  SLA_HOURS_UPDATED_EVENT
} from './generalSettings';

export type { SlaHoursMode };
export { SLA_HOURS_UPDATED_EVENT };

export const SLA_HOURS_MODE_OPTIONS: Array<{
  value: SlaHoursMode;
  label: string;
  description: string;
}> = [
  {
    value: '24-hour',
    label: '24 hour (all day)',
    description: 'The clock runs every minute, including nights and weekends.'
  },
  {
    value: 'shift-hours',
    label: 'Shift hours only',
    description:
      'The clock pauses when the assigned agent is off shift. Time is based on the agent’s working hours.'
  }
];

export function getSlaHoursMode(companyId: string = DEFAULT_COMPANY_ID): SlaHoursMode {
  return getGeneralSettings(companyId).slaHoursMode;
}

export function getSlaHoursModeLabel(mode: SlaHoursMode = getSlaHoursMode()): string {
  return SLA_HOURS_MODE_OPTIONS.find(o => o.value === mode)?.label || mode;
}

export function getSlaHoursModeDescription(mode: SlaHoursMode = getSlaHoursMode()): string {
  return SLA_HOURS_MODE_OPTIONS.find(o => o.value === mode)?.description || '';
}
