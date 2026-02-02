import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupabaseJwtGuard } from '../guards/supabase-jwt.guard';
import { AdminGuard } from '../guards/admin.guard';

export function AdminProtected(operation: string, description?: string) {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    UseGuards(SupabaseJwtGuard, AdminGuard),
    ApiOperation({ summary: `${operation} (Admin only)` }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Authentication required',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Admin access required',
    }),
    ...(description ? [ApiResponse({ status: 200, description })] : []),
  );
}

export function AdminPost(resourceName: string) {
  return applyDecorators(
    AdminProtected(`Create a new ${resourceName}`),
    ApiResponse({
      status: 201,
      description: `${resourceName} created successfully`,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid input data',
    }),
  );
}

export function AdminPatch(resourceName: string) {
  return applyDecorators(
    AdminProtected(`Update ${resourceName}`),
    ApiResponse({
      status: 200,
      description: `${resourceName} updated successfully`,
    }),
    ApiResponse({
      status: 404,
      description: `${resourceName} not found`,
    }),
  );
}

export function AdminDelete(resourceName: string) {
  return applyDecorators(
    AdminProtected(`Delete ${resourceName}`),
    ApiResponse({
      status: 200,
      description: `${resourceName} deleted successfully`,
    }),
    ApiResponse({
      status: 404,
      description: `${resourceName} not found`,
    }),
  );
}
