import { Routes } from '@angular/router';

export default [
  { path: 'public', loadChildren: () => import('./public/public.routes') },
  { path: 'admin', loadChildren: () => import('./admin/admin.routes') },
  { path: 'auth', loadChildren: () => import('./auth/auth.routes') },
  { path: '', pathMatch: 'full', redirectTo: 'public' },
  { path: '**', redirectTo: 'public' },
] as Routes;
