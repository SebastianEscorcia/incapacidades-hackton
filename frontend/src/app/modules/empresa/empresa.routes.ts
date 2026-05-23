import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./layout/empresa.layout').then((m) => m.EmpresaLayout),
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage) },
      { path: 'intake', loadComponent: () => import('./pages/intake/intake').then((m) => m.IntakePage) },
      { path: 'requirement', loadComponent: () => import('./pages/requirement/requirement').then((m) => m.RequirementPage) },
      { path: 'flujo', loadChildren: () => import('@shared/workflow/shared-workflow.routes') },
    ],
  },
] as Routes;
