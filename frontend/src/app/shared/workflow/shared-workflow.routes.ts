import { Routes } from '@angular/router';

export default [
  { path: 'preprocessing', loadComponent: () => import('./pages/preprocessing/preprocessing').then((m) => m.PreprocessingPage) },
  { path: 'ai-validation', loadComponent: () => import('./pages/ai-validation/ai-validation').then((m) => m.AiValidationPage) },
  { path: 'ai-result', loadComponent: () => import('./pages/ai-result/ai-result').then((m) => m.AiResultPage) },
  { path: 'business-validation', loadComponent: () => import('./pages/business-validation/business-validation').then((m) => m.BusinessValidationPage) },
  { path: 'institutional-validation', loadComponent: () => import('./pages/institutional-validation/institutional-validation').then((m) => m.InstitutionalValidationPage) },
  { path: 'expediente', loadComponent: () => import('./pages/expediente/expediente').then((m) => m.ExpedientePage) },
  { path: 'timeline', loadComponent: () => import('./pages/timeline/timeline').then((m) => m.TimelinePage) },
] as Routes;
