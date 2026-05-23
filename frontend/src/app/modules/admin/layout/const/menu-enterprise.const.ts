import { MenuItem } from 'primeng/api';

export const menuEnterprise: MenuItem[] = [
  { label: 'Dashboard admin', icon: 'pi pi-home', routerLink: ['/admin'] },
  { label: 'Portal empresa', icon: 'pi pi-building', routerLink: ['/empresa'] },
  { label: 'Portal EPS/ARL', icon: 'pi pi-briefcase', routerLink: ['/eps'] },
];
