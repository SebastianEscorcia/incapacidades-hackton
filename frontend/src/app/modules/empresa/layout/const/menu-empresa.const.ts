import { MenuItem } from 'primeng/api';

export const menuEmpresa: MenuItem[] = [
  {
    label: 'menu.enterprisePanel',
    icon: 'pi pi-home',
    routerLink: ['/empresa'],
    routerLinkActiveOptions: { paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' },
  },
  {
    label: 'menu.companiesList',
    icon: 'pi pi-building',
    routerLink: ['/empresa/empresas'],
    routerLinkActiveOptions: { paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' },
  },
  {
    label: 'menu.audit',
    icon: 'pi pi-history',
    routerLink: ['/empresa/auditoria'],
    routerLinkActiveOptions: { paths: 'subset', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' },
  },
];
