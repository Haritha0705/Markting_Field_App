import { Controller, Get, Request } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../../users/enums/users-type.enum';

/**
 * AuthTestController
 *
 * A scratchpad controller to verify that JWT auth and role-based
 * guards are wired up correctly. Remove (or gate behind NODE_ENV)
 * before shipping to production.
 *
 * Endpoints
 * ─────────────────────────────────────────────────────────────────
 * GET /auth/test/public        → No token required   (@Public)
 * GET /auth/test/me            → Any valid JWT
 * GET /auth/test/admin         → SuperAdmin or Admin only
 * GET /auth/test/field         → Agent or Customer only
 * ─────────────────────────────────────────────────────────────────
 */
@Controller('auth/test')
export class AuthTestController {
  // ──────────────────────────────────────────────
  // 1. PUBLIC – no token required
  // ──────────────────────────────────────────────
  /**
   * GET /auth/test/public
   *
   * Marked @Public() so the global AuthGuard lets it through.
   * Useful to confirm the server is up and the guard bypass works.
   */
  @Public()
  @Get('public')
  publicEndpoint() {
    return {
      endpoint: 'GET /auth/test/public',
      access: 'public (no token required)',
      message: '✅ Public endpoint is accessible to everyone.',
    };
  }

  // ──────────────────────────────────────────────
  // 2. ANY AUTHENTICATED USER – valid JWT, any role
  // ──────────────────────────────────────────────
  /**
   * GET /auth/test/me
   *
   * Requires a valid Bearer token. No @Roles() restriction so
   * the RolesGuard lets any authenticated role through.
   * Returns the decoded JWT payload attached by AuthGuard.
   */
  @Get('me')
  getMe(@Request() req: any) {
    return {
      endpoint: 'GET /auth/test/me',
      access: 'authenticated (any role)',
      message: '✅ Token is valid. Here is your identity.',
      user: req.user,
    };
  }

  // ──────────────────────────────────────────────
  // 3. ADMIN ROLES – SuperAdmin | Admin
  // ──────────────────────────────────────────────
  /**
   * GET /auth/test/admin
   *
   * Restricted to SuperAdmin and Admin roles via @Roles().
   * Agents and Customers will receive 403 Forbidden.
   */
  @Roles(Role.SuperAdmin, Role.Admin)
  @Get('admin')
  adminOnlyEndpoint(@Request() req: any) {
    return {
      endpoint: 'GET /auth/test/admin',
      access: `roles: [${Role.SuperAdmin}, ${Role.Admin}]`,
      message: '✅ You have admin-level access.',
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
    };
  }

  // ──────────────────────────────────────────────
  // 4. FIELD ROLES – Agent | Customer (multi-role)
  // ──────────────────────────────────────────────
  /**
   * GET /auth/test/field
   *
   * Accessible to field users: Agent and Customer.
   * SuperAdmin / Admin will receive 403 Forbidden
   * (demonstrating the guard works in both directions).
   */
  @Roles(Role.AGENT, Role.CUSTOMER)
  @Get('field')
  fieldUsersEndpoint(@Request() req: any) {
    return {
      endpoint: 'GET /auth/test/field',
      access: `roles: [${Role.AGENT}, ${Role.CUSTOMER}]`,
      message: '✅ You have field-user access.',
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
    };
  }
}
