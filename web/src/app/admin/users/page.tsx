"use client";

import { AdminRoleDashboard } from '@/components/admin/AdminRoleDashboard';
import { PermissionGuard } from '@/components/layout/PermissionGuard';

export default function AdminUsersPage() {
  return (
    <PermissionGuard requiredRole="admin">
      <AdminRoleDashboard />
    </PermissionGuard>
  );
}