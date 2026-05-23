import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@environments/environment';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('Authorization')) {
    return next(req);
  }

  const token = getStoredToken();
  if (!token) {
    return next(req);
  }

  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(clonedRequest);
};

function getStoredToken(): string {
  const configuredKey = (environment.TOKEN || 'TOKEN').trim();
  const keyCandidates = new Set<string>([environment.TOKEN || '', configuredKey, 'TOKEN', 'token']);

  for (const key of keyCandidates) {
    if (!key) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    const clean = raw.replace(/"/g, '').trim();
    if (!clean) continue;
    if (clean.toLowerCase() === 'null' || clean.toLowerCase() === 'undefined') continue;

    if (key !== configuredKey) {
      localStorage.setItem(configuredKey, JSON.stringify(clean));
    }
    return clean;
  }

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;
    if (key.trim().toUpperCase() !== 'TOKEN') continue;

    const raw = localStorage.getItem(key);
    if (!raw) continue;
    const clean = raw.replace(/"/g, '').trim();
    if (!clean) continue;
    if (clean.toLowerCase() === 'null' || clean.toLowerCase() === 'undefined') continue;
    localStorage.setItem(configuredKey, JSON.stringify(clean));
    return clean;
  }

  return '';
}
