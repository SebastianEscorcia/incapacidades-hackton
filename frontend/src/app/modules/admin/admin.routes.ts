import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/admin-dashboard').then((m) => m.AdminDashboard),
      },
    ],
  },
] as Routes;
