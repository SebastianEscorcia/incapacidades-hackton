import { MenuItem } from 'primeng/api';

export const menuEmpresa: MenuItem[] = [
  { label: 'menu.enterprisePanel', icon: 'pi pi-home', routerLink: ['/empresa'] },
  { label: 'menu.history', icon: 'pi pi-history', routerLink: ['/empresa/flujo/timeline'] },
];
