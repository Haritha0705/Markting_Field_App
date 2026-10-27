import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthTestController } from './controllers/auth-test.controller';
import { JwtAuthService } from './service/jwt.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UserModule } from '../users/user.module';

@Module({
  imports: [
    UserModule,
    // registerAsync so JWT_SECRET is read after ConfigModule has loaded .env
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('JWT_SECRET') ||
          'change_this_to_a_strong_secret_in_production',
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') || '24h') as any,
        },
      }),
    }),
  ],
  controllers: [
    AuthController,
    ...(process.env.NODE_ENV === 'production' ? [] : [AuthTestController]),
  ],
  providers: [
    JwtAuthService,
    // Apply AuthGuard globally — routes must opt-out with @Public()
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    // Apply RolesGuard globally — routes must opt-in with @Roles()
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [JwtAuthService],
})
export class AuthModule {}
