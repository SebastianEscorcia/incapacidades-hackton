import { ApplicationConfig, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core';
import { ActivatedRouteSnapshot, provideRouter, ViewTransitionInfo, withEnabledBlockingInitialNavigation, withHashLocation, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import Aura from '@primeuix/themes/aura';
import { routes } from './app.routes';

import localeEn from '@angular/common/locales/en';
import localeEsCo from '@angular/common/locales/es-CO';
import { registerLocaleData } from '@angular/common';
import { I18nService } from './core/i18n/i18n.service';
import { httpInterceptor } from './core/interceptors/auth.interceptor';
import { definePreset } from '@primeuix/themes';

registerLocaleData(localeEn, 'en-US');
registerLocaleData(localeEsCo, 'es-CO');
const ADMIN_AUTH_SEGMENTS = new Set(['admin', 'login', 'register', 'forgot-password', 'empresa', 'eps']);
const AuraCyanPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{cyan.50}',
      100: '{cyan.100}',
      200: '{cyan.200}',
      300: '{cyan.300}',
      400: '{cyan.400}',
      500: '{cyan.500}',
      600: '{cyan.600}',
      700: '{cyan.700}',
      800: '{cyan.800}',
      900: '{cyan.900}',
      950: '{cyan.950}',
    },
  },
});
function getRouteSegments(snapshot: ActivatedRouteSnapshot): string[] {
  return snapshot.pathFromRoot.flatMap((route) =>
    route.url.map((segment) => segment.path).filter(Boolean)
  );
}
function shouldSkipTransitionForRoute(info: ViewTransitionInfo): boolean {
  const fromSegments = getRouteSegments(info.from);
  const toSegments = getRouteSegments(info.to);
  return [...fromSegments, ...toSegments].some((segment) => ADMIN_AUTH_SEGMENTS.has(segment));
}
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      withEnabledBlockingInitialNavigation(),
      withHashLocation(),
      withViewTransitions({
        onViewTransitionCreated: (info) => {
          if (shouldSkipTransitionForRoute(info)) {
            info.transition.skipTransition?.();
          }
        },
      })),
    provideAnimations(),
    provideHttpClient(withFetch(), withInterceptors([httpInterceptor])),
    providePrimeNG({ theme: { preset: AuraCyanPreset, options: { darkModeSelector: '.app-dark' } } }),

    ConfirmationService,
    MessageService,

    {
      provide: LOCALE_ID,
      deps: [I18nService],
      useFactory: (i18n: I18nService) => i18n.locale(),
    },
  ],
};
