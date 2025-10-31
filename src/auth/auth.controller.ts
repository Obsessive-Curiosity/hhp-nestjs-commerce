import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './strategies/local.strategy';
import { Request as Req } from 'express';
import { SignupDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    console.log('Received DTO:', signupDto);
    return this.authService.signup(signupDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: Req) {
    return this.authService.login(req.user);
  }

  @Post('token/access')
  rotate(@Body('refreshToken') refreshToken: string) {
    return this.authService.rotateAccessToken(refreshToken);
  }
}
