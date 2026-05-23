import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class BaseHttpService {
  protected readonly http = inject(HttpClient);
  protected readonly baseUrl: string = environment.apiUrl;
  protected readonly ipUrl: string = environment.ipUrl;
  protected readonly utilsService = inject(UtilsService);

  private clientIp: string | null = null;

  private getHeaders(withToken: boolean, ip?: string): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (withToken) {
      const token = this.utilsService.getLocalStorage<string>('access_token');

      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    if (ip) {
      headers = headers.set('X-Client-IP', ip);
    }

    return headers;
  }

  private getIp(): Observable<string> {
    if (this.clientIp) {
      return of(this.clientIp);
    }

    return new Observable<string>((observer) => {
      fetch(this.ipUrl)
        .then((res) => res.json())
        .then((data: { ip?: string }) => {
          this.clientIp = data.ip ?? '0.0.0.0';
          observer.next(this.clientIp);
          observer.complete();
        })
        .catch(() => {
          this.clientIp = '0.0.0.0';
          observer.next(this.clientIp);
          observer.complete();
        });
    });
  }

  get<T>(
    endpoint: string,
    withToken: boolean = true,
    params?: { [param: string]: any },
  ): Observable<T> {
    return new Observable((observer) => {
      this.getIp().subscribe((ip) => {
        this.http
          .get<T>(`${this.baseUrl}/${endpoint}`, {
            headers: this.getHeaders(withToken, ip),
            params,
          })
          .subscribe(observer);
      });
    });
  }

  getText(
    endpoint: string,
    withToken: boolean = true,
    params?: { [param: string]: any },
  ): Observable<string> {
    return new Observable((observer) => {
      this.getIp().subscribe((ip) => {
        this.http
          .get(`${this.baseUrl}/${endpoint}`, {
            headers: this.getHeaders(withToken, ip),
            params,
            responseType: 'text',
          })
          .subscribe(observer);
      });
    });
  }

  getBlob(
    endpoint: string,
    withToken: boolean = true,
    params?: { [param: string]: any },
  ): Observable<Blob> {
    return new Observable((observer) => {
      this.getIp().subscribe((ip) => {
        this.http
          .get(`${this.baseUrl}/${endpoint}`, {
            headers: this.getHeaders(withToken, ip),
            params,
            responseType: 'blob',
          })
          .subscribe(observer);
      });
    });
  }

  post<T>(
    endpoint: string,
    body: any,
    withToken: boolean = true,
    params?: { [param: string]: any },
  ): Observable<T> {
    return new Observable((observer) => {
      this.getIp().subscribe((ip) => {
        this.http
          .post<T>(`${this.baseUrl}/${endpoint}`, body, {
            headers: this.getHeaders(withToken, ip),
            params,
          })
          .subscribe(observer);
      });
    });
  }

  put<T>(endpoint: string, body: any, withToken: boolean = true): Observable<T> {
    return new Observable((observer) => {
      this.getIp().subscribe((ip) => {
        this.http
          .put<T>(`${this.baseUrl}/${endpoint}`, body, {
            headers: this.getHeaders(withToken, ip),
          })
          .subscribe(observer);
      });
    });
  }

  patch<T>(endpoint: string, body: any, withToken: boolean = true): Observable<T> {
    return new Observable((observer) => {
      this.getIp().subscribe((ip) => {
        this.http
          .patch<T>(`${this.baseUrl}/${endpoint}`, body, {
            headers: this.getHeaders(withToken, ip),
          })
          .subscribe(observer);
      });
    });
  }

  delete<T>(endpoint: string, withToken: boolean = true): Observable<T> {
    return new Observable((observer) => {
      this.getIp().subscribe((ip) => {
        this.http
          .delete<T>(`${this.baseUrl}/${endpoint}`, {
            headers: this.getHeaders(withToken, ip),
          })
          .subscribe(observer);
      });
    });
  }
}
