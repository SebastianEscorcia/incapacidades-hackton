import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./layout/empresa.layout').then((m) => m.EmpresaLayout),
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage) },
      { path: 'empresas', loadComponent: () => import('./pages/empresas/empresas').then((m) => m.EmpresasPage) },
      { path: 'auditoria', loadComponent: () => import('./pages/auditoria/auditoria').then((m) => m.AuditoriaPage) },
      { path: 'intake', loadComponent: () => import('./pages/intake/intake').then((m) => m.IntakePage) },
      { path: 'auditoria/:companyId', loadComponent: () => import('./pages/auditoria/auditoria').then((m) => m.AuditoriaPage) },
      { path: 'flujo', loadChildren: () => import('@shared/workflow/shared-workflow.routes') },
    ],
  },
] as Routes;
