import { environment } from '../../../environments/environment';
import type { AppLanguage, AppLanguageOption, TranslationDictionary } from './i18n.types';

export const APP_LANGUAGES: AppLanguageOption[] = [
  { code: 'en', label: 'English', locale: 'en-US' },
  { code: 'es', label: 'Español', locale: 'es-CO' },
];

export const APP_LANGUAGE_LOCALES: Record<AppLanguage, string> = {
  en: 'en-US',
  es: 'es-CO',
};

export const APP_TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  en: {
    app: {
      title: environment.app_name,
      adminPanel: 'Admin Panel',
      publicArea: 'Public Area',
      enterprise: 'Enterprise',
      customers: 'Customers',
    },
    auth: {
      brandTitle: environment.app_name,
      brandSubtitle: 'Enterprise Angular starter template',
      loginAction: 'Sign in',
      registerAction: 'Create account',
      forgotAction: 'Send instructions',
      recoverAction: 'Change password',
    },
    common: {
      accept: 'Accept',
      cancel: 'Cancel',
      close: 'Close',
      language: 'Language',
      save: 'Save',
      search: 'Search',
    },
    navigation: {
      home: 'Home',
      admin: 'Admin',
    },
    pages: {
      dashboard: 'Dashboard',
      dashboardDescription: 'This page confirms that the admin module and layout are working.',
      auth: 'Authentication',
      authDescription: 'This page confirms that the auth module is routing correctly.',
      loginDescription: 'Sign in with your email and password to continue.',
      register: 'Create Account',
      registerDescription: 'Register an account to start working.',
      forgotPassword: 'Recover Password',
      forgotPasswordDescription: 'We will send instructions to restore your access.',
      recoverPassword: 'New Password',
      recoverPasswordDescription: 'Create a new secure password for your account.',
      public: 'Public',
      publicDescription:
        'Launch a modern SaaS experience with public pages, authentication, dashboards, shared components, routing, i18n, and data access ready to extend.',
      enterprise: 'Enterprise Dashboard',
      enterpriseDescription: 'This page is ready for company-wide workflows and operational views.',
      customers: 'Customers Dashboard',
      customersDescription: 'This page is ready for customer management workflows.',
    },
  },
  es: {
    app: {
      title: environment.app_name,
      adminPanel: 'Panel Administrativo',
      publicArea: 'Área Pública',
      enterprise: 'Empresa',
      customers: 'Clientes',
    },
    auth: {
      brandTitle: environment.app_name,
      brandSubtitle: 'Plantilla empresarial para Angular',
      loginAction: 'Ingresar',
      registerAction: 'Registrarme',
      forgotAction: 'Enviar instrucciones',
      recoverAction: 'Cambiar contraseña',
    },
    common: {
      accept: 'Aceptar',
      cancel: 'Cancelar',
      close: 'Cerrar',
      language: 'Idioma',
      save: 'Guardar',
      search: 'Buscar',
    },
    navigation: {
      home: 'Inicio',
      admin: 'Administración',
    },
    pages: {
      dashboard: 'Panel',
      dashboardDescription:
        'Esta página confirma que el módulo admin y su layout funcionan correctamente.',
      auth: 'Autenticación',
      authDescription: 'Esta página confirma que el módulo de autenticación enruta correctamente.',
      loginDescription: 'Ingresa con tu correo y contraseña para continuar.',
      register: 'Crear Cuenta',
      registerDescription: 'Registra una cuenta para empezar a trabajar.',
      forgotPassword: 'Recuperar Contraseña',
      forgotPasswordDescription: 'Te enviaremos instrucciones para restablecer tu acceso.',
      recoverPassword: 'Nueva Contraseña',
      recoverPasswordDescription: 'Crea una nueva contraseña segura para tu cuenta.',
      public: 'Público',
      publicDescription:
        'Lanza una experiencia SaaS moderna con páginas públicas, autenticación, dashboards, componentes compartidos, rutas, i18n y acceso a datos listo para extender.',
      enterprise: 'Panel Empresarial',
      enterpriseDescription:
        'Esta página está lista para flujos empresariales y vistas operativas.',
      customers: 'Panel de Clientes',
      customersDescription: 'Esta página está lista para flujos de gestión de clientes.',
    },
  },
};
