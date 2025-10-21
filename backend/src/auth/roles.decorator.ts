import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type Role = 'ADMIN' | 'CUSTOMER' | string;

/**
 * Use like: @Roles('ADMIN') or @Roles('ADMIN','MANAGER')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
