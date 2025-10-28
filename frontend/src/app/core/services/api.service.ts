import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Test backend connection
  testConnection(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }

  // Get server status
  getServerStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }
}