/** Team names available per company for category handling-team assignment. */
export const HANDLING_TEAMS_BY_COMPANY: Record<string, string[]> = {
  'co-acme': [
    'HR Support',
    'Attendance Desk',
    'Leave Desk',
    'Payroll Support',
    'IT Support',
    'Administration Support',
    'Employee Experience Desk',
    'Workplace Services'
  ],
  'co-northwind': ['Northwind Ops Desk', 'Northwind Fleet Desk'],
  'co-contoso': ['Contoso People Ops', 'Contoso Retail HR']
};

export const handlingTeamsForCompany = (companyId: string): string[] =>
  HANDLING_TEAMS_BY_COMPANY[companyId] || [];
