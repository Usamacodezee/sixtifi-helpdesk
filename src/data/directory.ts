export interface DirectoryPerson {
  id: string;
  name: string;
  initials: string;
  department: string;
  companyId: string;
}

/** Org units selectable as audience "groups" */
export type DirectoryGroupKind = 'department' | 'sub-department' | 'business-unit' | 'location';

export interface DirectoryGroup {
  id: string;
  name: string;
  kind: DirectoryGroupKind;
  description: string;
  memberCount: number;
  companyId: string;
}

export const DIRECTORY_GROUP_KIND_LABEL: Record<DirectoryGroupKind, string> = {
  department: 'Department',
  'sub-department': 'Sub-department',
  'business-unit': 'Business unit',
  location: 'Location'
};

export const DIRECTORY_GROUP_KIND_SHORT: Record<DirectoryGroupKind, string> = {
  department: 'D',
  'sub-department': 'SD',
  'business-unit': 'BU',
  location: 'L'
};

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
  // Acme — departments (keep legacy ids used by seed categories)
  {
    id: 'grp-hr',
    name: 'HR',
    kind: 'department',
    description: 'Human Resources',
    memberCount: 48,
    companyId: 'co-acme'
  },
  {
    id: 'grp-payroll',
    name: 'Payroll',
    kind: 'department',
    description: 'Payroll & compensation',
    memberCount: 22,
    companyId: 'co-acme'
  },
  {
    id: 'grp-it',
    name: 'IT',
    kind: 'department',
    description: 'Information Technology',
    memberCount: 36,
    companyId: 'co-acme'
  },
  {
    id: 'grp-ops',
    name: 'Operations',
    kind: 'department',
    description: 'Business operations',
    memberCount: 61,
    companyId: 'co-acme'
  },
  // Acme — sub-departments
  {
    id: 'grp-hr-ta',
    name: 'Talent Acquisition',
    kind: 'sub-department',
    description: 'HR · recruiting',
    memberCount: 12,
    companyId: 'co-acme'
  },
  {
    id: 'grp-hr-benefits',
    name: 'Benefits Admin',
    kind: 'sub-department',
    description: 'HR · benefits',
    memberCount: 8,
    companyId: 'co-acme'
  },
  {
    id: 'grp-it-l1',
    name: 'IT L1 Support',
    kind: 'sub-department',
    description: 'IT · service desk',
    memberCount: 14,
    companyId: 'co-acme'
  },
  // Acme — business units
  {
    id: 'grp-bu-corp',
    name: 'Corporate',
    kind: 'business-unit',
    description: 'Corporate services',
    memberCount: 210,
    companyId: 'co-acme'
  },
  {
    id: 'grp-bu-shared',
    name: 'Shared Services',
    kind: 'business-unit',
    description: 'Central shared services',
    memberCount: 95,
    companyId: 'co-acme'
  },
  // Acme — locations
  {
    id: 'grp-loc-mumbai',
    name: 'Mumbai HQ',
    kind: 'location',
    description: 'Headquarters',
    memberCount: 320,
    companyId: 'co-acme'
  },
  {
    id: 'grp-loc-surat',
    name: 'Surat Branch',
    kind: 'location',
    description: 'Gujarat office',
    memberCount: 84,
    companyId: 'co-acme'
  },
  {
    id: 'grp-loc-blr',
    name: 'Bangalore Office',
    kind: 'location',
    description: 'Karnataka office',
    memberCount: 142,
    companyId: 'co-acme'
  },

  // Northwind
  {
    id: 'grp-warehouse',
    name: 'Warehouse',
    kind: 'department',
    description: 'Warehouse operations',
    memberCount: 67,
    companyId: 'co-northwind'
  },
  {
    id: 'grp-drivers',
    name: 'Fleet',
    kind: 'department',
    description: 'Fleet & drivers',
    memberCount: 42,
    companyId: 'co-northwind'
  },
  {
    id: 'grp-nw-logistics',
    name: 'Logistics',
    kind: 'department',
    description: 'Transport planning',
    memberCount: 28,
    companyId: 'co-northwind'
  },
  {
    id: 'grp-nw-inbound',
    name: 'Inbound',
    kind: 'sub-department',
    description: 'Warehouse · receiving',
    memberCount: 24,
    companyId: 'co-northwind'
  },
  {
    id: 'grp-nw-outbound',
    name: 'Outbound',
    kind: 'sub-department',
    description: 'Warehouse · dispatch',
    memberCount: 31,
    companyId: 'co-northwind'
  },
  {
    id: 'grp-nw-bu-dist',
    name: 'Distribution',
    kind: 'business-unit',
    description: 'Distribution network',
    memberCount: 180,
    companyId: 'co-northwind'
  },
  {
    id: 'grp-nw-chicago',
    name: 'Chicago Hub',
    kind: 'location',
    description: 'Primary hub',
    memberCount: 110,
    companyId: 'co-northwind'
  },
  {
    id: 'grp-nw-dallas',
    name: 'Dallas Depot',
    kind: 'location',
    description: 'Regional depot',
    memberCount: 64,
    companyId: 'co-northwind'
  },

  // Contoso
  {
    id: 'grp-store',
    name: 'Store Ops',
    kind: 'department',
    description: 'Store operations',
    memberCount: 88,
    companyId: 'co-contoso'
  },
  {
    id: 'grp-cashiers',
    name: 'Retail HR',
    kind: 'department',
    description: 'Retail people ops',
    memberCount: 34,
    companyId: 'co-contoso'
  },
  {
    id: 'grp-ct-floor',
    name: 'Floor Staff',
    kind: 'sub-department',
    description: 'Store Ops · floor',
    memberCount: 120,
    companyId: 'co-contoso'
  },
  {
    id: 'grp-ct-bu-west',
    name: 'Retail West',
    kind: 'business-unit',
    description: 'Western retail region',
    memberCount: 260,
    companyId: 'co-contoso'
  },
  {
    id: 'grp-ct-seattle',
    name: 'Seattle Flagship',
    kind: 'location',
    description: 'Flagship store',
    memberCount: 72,
    companyId: 'co-contoso'
  },
  {
    id: 'grp-ct-portland',
    name: 'Portland Store',
    kind: 'location',
    description: 'Oregon store',
    memberCount: 41,
    companyId: 'co-contoso'
  }
];

export const employeesForCompany = (companyId: string) =>
  DIRECTORY_EMPLOYEES.filter(e => e.companyId === companyId);

export const groupsForCompany = (companyId: string) =>
  DIRECTORY_GROUPS.filter(g => g.companyId === companyId);
