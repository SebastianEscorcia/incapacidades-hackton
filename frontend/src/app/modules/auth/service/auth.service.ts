import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { loginPayload, loginResponse, currentUser } from '../models';
import { ContentResponse } from '@/core/types';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  api = environment.apiUrl;
  prefix = 'v0.1.0/auth';
  http = inject(HttpClient);

  Login(data: loginPayload): Observable<ContentResponse<loginResponse>> {
    return this.http
      .post<ContentResponse<loginResponse>>(
        `${this.api}/${this.prefix}/login`,
        data
      )
      .pipe(catchError((error) => throwError(() => error)));
  }
  // Forgot(data: userForgot): Observable<ContentResponse<userForgot>> {
  //   return this.http
  //     .post<ContentResponse<userForgot>>(
  //       `${this.api}/${this.prefix}/password/forgot`,
  //       data
  //     )
  //     .pipe(catchError((error) => throwError(() => error)));
  // }
  // ChangePasswordForgot(data: userForgotChangePasswordPayload): Observable<ContentResponse<userForgotChangePasswordPayload>> {
  //   return this.http
  //     .patch<ContentResponse<userForgotChangePasswordPayload>>(
  //       `${this.api}/${this.prefix}/password/reset`,
  //       data
  //     )
  //     .pipe(catchError((error) => throwError(() => error)));
  // }
  Profile(): Observable<ContentResponse<currentUser>> {
    return this.http
      .get<ContentResponse<any>>(`${this.api}/${this.prefix}/profile`)
      .pipe(catchError((error) => throwError(() => error)));
  }
}
