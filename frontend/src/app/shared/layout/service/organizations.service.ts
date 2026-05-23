import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrganizationsService {

  private http = inject(HttpClient);
  api = environment.apiUrl;
  prefix = 'v0.1.0';

  createOrganization(data: any) {

    return this.http.post(`${this.api}/${this.prefix}/organizations`, data,);
  }
}

//     getOrganizations(): Observable<Organization[]> {
//     return this.http.get<any>(this.api).pipe(
//       map((res) => {
//         if (Array.isArray(res)) return res;
//         return res?.data ?? [];
//       })
//     );
//   }
