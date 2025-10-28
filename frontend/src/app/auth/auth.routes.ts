import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent) 
  },
  { 
    path: 'verify-otp', 
    loadComponent: () => import('./components/verify-otp/verify-otp.component').then(m => m.VerifyOtpComponent) 
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];