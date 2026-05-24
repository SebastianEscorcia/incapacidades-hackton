export interface EmpresaCompany {
  id: string;
  name: string;
  sector: string;
  ruc: string;
}

export const EMPRESA_COMPANIES: EmpresaCompany[] = [
  { id: 'COMP-001', name: 'Acme Salud Ocupacional', sector: 'Servicios', ruc: '800123456-1' },
  { id: 'COMP-002', name: 'Logística del Norte', sector: 'Transporte', ruc: '900987654-2' },
  { id: 'COMP-003', name: 'Servicios Médicos Integrales', sector: 'Salud', ruc: '890456123-3' },
  { id: 'COMP-004', name: 'Construcciones y Equipos SAS', sector: 'Construcción', ruc: '901321789-4' },
];
