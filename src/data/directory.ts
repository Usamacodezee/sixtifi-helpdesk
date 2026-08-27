export interface DirectoryPerson {
  id: string;
  name: string;
  initials: string;
  department: string;
  companyId: string;
}

export interface DirectoryGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  companyId: string;
}

export const DIRECTORY_EMPLOYEES: DirectoryPerson[] = [
  { id: 'emp-ashish', name: 'Ashish Kapoor', initials: 'AK', department: 'HR', companyId: 'co-acme' },
  { id: 'emp-rahul', name: 'Rahul Sharma', initials: 'RS', department: 'Operations', companyId: 'co-acme' },
  { id: 'emp-priya', name: 'Priya Shah', initials: 'PS', department: 'Payroll', companyId: 'co-acme' },
  { id: 'emp-neha', name: 'Neha Patel', initials: 'NP', department: 'IT', companyId: 'co-acme' },
  { id: 'emp-jordan', name: 'Jordan Lee', initials: 'JL', department: 'Warehouse', companyId: 'co-northwind' },
  { id: 'emp-sam', name: 'Sam Okonkwo', initials: 'SO', department: 'Fleet', companyId: 'co-northwind' },
  { id: 'emp-mia', name: 'Mia Chen', initials: 'MC', department: 'Store Ops', companyId: 'co-contoso' },
  { id: 'emp-dev', name: 'Dev Patel', initials: 'DP', department: 'Retail HR', companyId: 'co-contoso' }
];

export const DIRECTORY_GROUPS: DirectoryGroup[] = [
  {
    id: 'grp-hr',
    name: 'HR Business Partners',
    description: 'HR partners across locations',
    memberCount: 18,
    companyId: 'co-acme'
  },
  {
    id: 'grp-payroll',
    name: 'Payroll Ops',
    description: 'Payroll processors and leads',
    memberCount: 9,
    companyId: 'co-acme'
  },
  {
    id: 'grp-it',
    name: 'IT Support Desk',
    description: 'L1/L2 IT agents',
    memberCount: 14,
    companyId: 'co-acme'
  },
  {
    id: 'grp-drivers',
    name: 'Fleet Drivers',
    description: 'On-road logistics drivers',
    memberCount: 42,
    companyId: 'co-northwind'
  },
  {
    id: 'grp-warehouse',
    name: 'Warehouse Floor',
    description: 'Warehouse associates',
    memberCount: 67,
    companyId: 'co-northwind'
  },
  {
    id: 'grp-store',
    name: 'Store Managers',
    description: 'Retail store managers',
    memberCount: 28,
    companyId: 'co-contoso'
  },
  {
    id: 'grp-cashiers',
    name: 'Frontline Cashiers',
    description: 'POS and floor staff',
    memberCount: 120,
    companyId: 'co-contoso'
  }
];

export const employeesForCompany = (companyId: string) =>
  DIRECTORY_EMPLOYEES.filter(e => e.companyId === companyId);

export const groupsForCompany = (companyId: string) =>
  DIRECTORY_GROUPS.filter(g => g.companyId === companyId);
