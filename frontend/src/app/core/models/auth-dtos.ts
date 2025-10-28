import { User } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'CUSTOMER' | 'ADMIN';
  store?: {
    name: string;
    location: string;
  };
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

