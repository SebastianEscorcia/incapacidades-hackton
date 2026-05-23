import { Routes } from '@angular/router';

export default [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/register/register-page').then((m) => m.RegisterPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/forgot-password/forgot-password-page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'recover-password',
    loadComponent: () =>
      import('./features/recover-password/recover-password-page').then(
        (m) => m.RecoverPasswordPage,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
] as Routes;
