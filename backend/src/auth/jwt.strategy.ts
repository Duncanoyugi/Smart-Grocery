import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;      // User ID (from your token)
  email: string;    // User email
  role: string;     // User role
  iat?: number;     // Issued at (optional)
  exp?: number;     // Expiration (optional)
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecretkey',
    });
  }

  async validate(payload: JwtPayload) {
    // Use payload.sub as the user ID (matches your token structure)
    const user = await this.prisma.user.findUnique({ 
      where: { id: payload.sub }  // Using 'sub' field as user ID
    });
    
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email address');
    }

    // Return object attached to request.user
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
    };
  }
}