import { Injectable, inject, InjectionToken } from '@angular/core';
import { Router } from '@angular/router';

export const ROLE_NAVIGATION_MAP = new InjectionToken<Record<string, string[]>>('ROLE_NAVIGATION_MAP');

const DEFAULT_ROLE_ROUTES: Record<string, string[]> = {
    admin: ['/admin'],
    user: ['/public'],
    empleador: ['/empresa'],
    eps: ['/eps'],
};

@Injectable({
    providedIn: 'root'
})
export class NavegarByRol {
    private readonly route = inject(Router);
    private readonly navigationMap = {
        ...DEFAULT_ROLE_ROUTES,
        ...(inject(ROLE_NAVIGATION_MAP, { optional: true }) || {})
    };

    navegarByRol(role: string) {
        const normalizedRole = (role || '').toLowerCase().trim();
        const targetRoute = this.navigationMap[normalizedRole] || ['/login'];
        this.route.navigate(targetRoute);
    }
}

