import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpService {
  generateOtp(): string {
    // 6-digit random OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  getExpiryTime(): Date {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // expires in 10 mins
    return expiry;
  }
}
