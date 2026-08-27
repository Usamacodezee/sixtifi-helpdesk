export interface HelpdeskCompany {
  id: string;
  name: string;
  shortName: string;
}

export const HELPDESK_COMPANIES: HelpdeskCompany[] = [
  { id: 'co-acme', name: 'Acme Corp (HQ)', shortName: 'Acme' },
  { id: 'co-northwind', name: 'Northwind Logistics', shortName: 'Northwind' },
  { id: 'co-contoso', name: 'Contoso Retail', shortName: 'Contoso' }
];

export const DEFAULT_COMPANY_ID = HELPDESK_COMPANIES[0].id;

export const getCompanyById = (id: string): HelpdeskCompany =>
  HELPDESK_COMPANIES.find(c => c.id === id) || HELPDESK_COMPANIES[0];
