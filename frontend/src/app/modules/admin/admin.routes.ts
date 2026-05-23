import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./layout/page/admin.layout').then((m) => m.AppAdminLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/admin-dashboard').then((m) => m.AdminDashboard),
      },
    ],
  },
] as Routes;
