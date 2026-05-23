import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/public-home').then((m) => m.PublicHome),
  },
] as Routes;
