import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';

// Inline DTO definitions (replace or move to a separate ./dto file if preferred)
export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  // -------------------------
  // REGISTER USER
  // -------------------------
  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    const newUser = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        otp,
        otpExpiresAt,
        isVerified: false,
      },
    });

    // Send OTP email using template
    await this.mailerService.sendOtpEmail(email, name, otp);

    return {
      message: 'Registration successful. Check your email for the OTP to verify your account.',
      email: newUser.email,
    };
  }

  // -------------------------
  // VERIFY OTP
  // -------------------------
  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Invalid email');

    if (user.isVerified) {
      throw new BadRequestException('Account already verified.');
    }

    if (user.otp !== otp) throw new BadRequestException('Invalid OTP');

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP expired. Please register again.');
    }

    await this.prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otp: null,
        otpExpiresAt: null,
      },
    });

    return { message: 'OTP verified successfully. You can now log in.' };
  }

  // -------------------------
  // LOGIN USER
  // -------------------------
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email with OTP first.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    // Send welcome email only after first verified login
    if (!user.verificationCode) {
      await this.mailerService.sendWelcomeEmail(user.email, user.name);

      await this.prisma.user.update({
        where: { email },
        data: { verificationCode: 'SENT' }, // mark welcome email sent
      });
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
