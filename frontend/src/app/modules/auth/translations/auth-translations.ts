import { environment } from '../../../../environments/environment';
import type { AppLanguage, TranslationDictionary } from '../../../core/i18n/i18n.types';
import type { I18nService } from '../../../core/i18n/i18n.service';

export const AUTH_TRANSLATIONS: Partial<Record<AppLanguage, TranslationDictionary>> = {
  en: {
    auth: {
      brandTitle: 'Frontend',
      brandSubtitle: 'EPS / ARL document management with traceability, AI validation and enterprise-operator flow.',
      feature1: 'Massive enterprise upload',
      feature2: 'Shared AI validation',
      feature3: 'EPS / ARL filing',
      loginAction: 'Sign in',
      registerAction: 'Create account',
      forgotAction: 'Send instructions',
      recoverAction: 'Change password',
      email: 'Email address',
      password: 'Password',
      forgotPassword: 'Forgot password?',
      createAccount: 'Create account',
      backToStart: 'Back to start',
      mockTitle: 'Flow demo (mock)',
      enterAsCompany: 'Enter as Enterprise',
      enterAsEps: 'Enter as EPS/ARL',
      emailRequired: 'Enter a valid email.',
      passwordRequired: 'Password is required.',
      fullName: 'Full name',
      fullNameRequired: 'Full name is required.',
      confirmPassword: 'Confirm password',
      confirmPasswordRequired: 'Please confirm your password.',
      passwordsMustMatch: 'Passwords must match.',
      recoveryCode: 'Recovery code',
      recoveryCodeRequired: 'Recovery code is required.',
      alreadyHaveAccount: 'Already have an account?',
      alreadyHaveCode: 'I already have a code',
      backToLogin: 'Back to sign in',
    },
    pages: {
      auth: 'Authentication',
      authDescription: 'This page confirms that the auth module is routing correctly.',
      loginDescription: 'Sign in with your email and password to continue.',
      register: 'Create Account',
      registerDescription: 'Register an account to start working.',
      forgotPassword: 'Recover Password',
      forgotPasswordDescription: 'We will send instructions to restore your access.',
      recoverPassword: 'New Password',
      recoverPasswordDescription: 'Create a new secure password for your account.',
    },
  },
  es: {
    auth: {
      brandTitle: 'Frontend',
      brandSubtitle: 'Gestión documental EPS / ARL con trazabilidad, validación IA y flujo empresa-operador.',
      feature1: 'Carga masiva empresa',
      feature2: 'Validación IA compartida',
      feature3: 'Radicación EPS / ARL',
      loginAction: 'Ingresar',
      registerAction: 'Registrarme',
      forgotAction: 'Enviar instrucciones',
      recoverAction: 'Cambiar contraseña',
      email: 'Correo electrónico',
      password: 'Contraseña',
      forgotPassword: '¿Olvidaste la contraseña?',
      createAccount: 'Crear cuenta',
      backToStart: 'Volver al inicio',
      mockTitle: 'Demo flujo (mock)',
      enterAsCompany: 'Entrar como Empresa',
      enterAsEps: 'Entrar como EPS/ARL',
      emailRequired: 'Ingrese un correo válido.',
      passwordRequired: 'La contraseña es requerida.',
      fullName: 'Nombre completo',
      fullNameRequired: 'El nombre es requerido.',
      confirmPassword: 'Confirmar contraseña',
      confirmPasswordRequired: 'Por favor confirma tu contraseña.',
      passwordsMustMatch: 'Las contraseñas deben coincidir.',
      recoveryCode: 'Código de recuperación',
      recoveryCodeRequired: 'El código es requerido.',
      alreadyHaveAccount: 'Ya tengo una cuenta',
      alreadyHaveCode: 'Ya tengo un código',
      backToLogin: 'Volver a iniciar sesión',
    },
    pages: {
      auth: 'Autenticación',
      authDescription: 'Esta página confirma que el módulo de autenticación enruta correctamente.',
      loginDescription: 'Ingresa con tu correo y contraseña para continuar.',
      register: 'Crear Cuenta',
      registerDescription: 'Registra una cuenta para empezar a trabajar.',
      forgotPassword: 'Recuperar Contraseña',
      forgotPasswordDescription: 'Te enviaremos instrucciones para restablecer tu acceso.',
      recoverPassword: 'Nueva Contraseña',
      recoverPasswordDescription: 'Crea una nueva contraseña segura para tu cuenta.',
    },
  },
};

let authTranslationsRegistered = false;

export function registerAuthTranslations(i18nService: I18nService): void {
  if (authTranslationsRegistered) {
    return;
  }

  i18nService.registerTranslations(AUTH_TRANSLATIONS);
  authTranslationsRegistered = true;
}
