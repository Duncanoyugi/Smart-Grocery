import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { LoginRequest, RegisterRequest, VerifyOtpRequest, AuthResponse } from '../models/auth-dtos';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  register(registerData: RegisterRequest): Observable<ApiResponse<{ user: User; store?: any }>> {
    return this.http.post<ApiResponse<{ user: User; store?: any }>>(
      `${this.apiUrl}/auth/register`, 
      registerData
    );
  }

  verifyOtp(verifyData: VerifyOtpRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.apiUrl}/auth/verify-otp`, 
      verifyData
    );
  }

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.apiUrl}/auth/login`, 
      credentials
    ).pipe(
      tap(response => {
        if (response.success) {
          this.setSession(response.data);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/users/me`);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private setSession(authResult: AuthResponse): void {
    localStorage.setItem('token', authResult.access_token);
    localStorage.setItem('user', JSON.stringify(authResult.user));
    this.currentUserSubject.next(authResult.user);
  }

  private loadStoredUser(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        
        // Verify token is still valid by fetching current user
        this.getCurrentUser().subscribe({
          next: (response) => {
            if (response.success) {
              this.currentUserSubject.next(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));
            } else {
              this.logout();
            }
          },
          error: () => {
            this.logout();
          }
        });
      } catch (error) {
        this.logout();
      }
    }
  }
}