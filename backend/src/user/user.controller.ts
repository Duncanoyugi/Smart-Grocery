import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';

// All routes protected
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/me
  @Get('me')
  async me(@Req() req) {
    const userId = req.user?.id || req.user?.sub; // depends on JwtStrategy return
    return this.usersService.getProfile(userId);
  }

  // PATCH /users/update -> multipart/form-data (optional file 'avatar')
  @Patch('update')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateProfile(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UpdateProfileDto,
  ) {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) throw new BadRequestException('Invalid user');

    return this.usersService.updateProfile(userId, body, file);
  }

  // PATCH /users/change-password
  @Patch('change-password')
  async changePassword(@Req() req, @Body() body: ChangePasswordDto) {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) throw new BadRequestException('Invalid user');

    return this.usersService.changePassword(userId, body);
  }
}
