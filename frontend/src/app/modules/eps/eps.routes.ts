import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./layout/eps.layout').then((m) => m.EpsLayout),
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.EpsDashboardPage) },
      { path: 'eps-response', loadComponent: () => import('./pages/eps-response/eps-response').then((m) => m.EpsResponsePage) },
      { path: 'flujo', loadChildren: () => import('@shared/workflow/shared-workflow.routes') },
    ],
  },
] as Routes;
