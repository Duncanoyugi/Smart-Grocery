// Remove Store import from here, we'll handle it differently
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'CUSTOMER' | 'ADMIN';
  isVerified: boolean;
  otp?: string;
  otpExpiresAt?: Date;
  verificationCode?: string;
  avatarUrl?: string;
  avatarPublicId?: string;
  createdAt: Date;
  updatedAt: Date;
  store?: any;
}