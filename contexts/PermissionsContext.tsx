'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { AppRole, Database } from '@/types/database';

type UsersRow = Database['public']['Tables']['users']['Row'];
type PermissionsRow = Database['public']['Tables']['permissions']['Row'];
type CompanyApplicationsRow = Database['public']['Tables']['company_applications']['Row'];

export interface Permission {
  id: string;
  label: string;
  description: string;
  route?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
  canPromoteToCeo?: boolean;
}

export interface JoinRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  message: string;
  department?: string;
  position?: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  assignedRole?: string;
}

// All available permissions in the system
export const allPermissions: Permission[] = [
  { id: 'dashboard', label: 'View Dashboard', description: 'Access to employee dashboard', route: '/dashboard' },
  { id: 'attendance', label: 'My Attendance', description: 'View own attendance records', route: '/attendance' },
  { id: 'salary', label: 'My Salary', description: 'View own salary information', route: '/salary' },
  { id: 'profile', label: 'My Profile', description: 'Edit personal profile', route: '/profile' },
  { id: 'work-session', label: 'Work Session', description: 'Start/end work sessions', route: '/work-session' },
  { id: 'verification', label: 'Verification', description: 'View and complete verification requests', route: '/employee-verification' },
  { id: 'manager-dashboard', label: 'Manager Dashboard', description: 'Access manager dashboard', route: '/dashboard/manager' },
  { id: 'ceo-dashboard', label: 'CEO Dashboard', description: 'Access CEO dashboard with company overview', route: '/dashboard/ceo' },
  { id: 'team', label: 'Team Management', description: 'View and manage team members', route: '/team' },
  { id: 'verification-control', label: 'Verification Control', description: 'Send and review verification requests', route: '/verification-control' },
  { id: 'reports', label: 'Reports & Analytics', description: 'Access to reports and analytics', route: '/reports' },
  { id: 'work-time-control', label: 'Work Time Control', description: 'Control break times and work hours', route: '/work-time-control' },
  { id: 'leave-requests', label: 'Leave Requests', description: 'Manage employee leave requests', route: '/leave-requests' },
  { id: 'company-settings', label: 'Company Settings', description: 'Modify company configuration', route: '/company-settings' },
  { id: 'roles', label: 'Role Management', description: 'Create and modify roles (CEO only)', route: '/roles' },
  { id: 'salary-config', label: 'Salary Configuration', description: 'Configure salary rules', route: '/salary-config' },
  { id: 'staff-requests', label: 'Staff Requests', description: 'Approve/reject staff join requests', route: '/staff-requests' },
  { id: 'announcements', label: 'Announcements', description: 'Send company-wide announcements', route: '/announcements' },
];

// Default roles configuration
const defaultRoleConfigs: Record<string, { name: string; description: string; permissions: string[]; isSystem: boolean }> = {
  'ceo': {
    name: 'CEO / Chairman',
    description: 'Full access to all features and settings',
    permissions: ['all'],
    isSystem: true,
  },
  'admin': {
    name: 'Admin',
    description: 'Manage company settings and users',
    permissions: ['dashboard', 'manager-dashboard', 'team', 'verifications-control', 'reports', 'company-settings', 'salary-config', 'staff-requests', 'salary', 'work-time-control', 'leave-requests', 'announcements'],
    isSystem: false,
  },
  'manager': {
    name: 'Manager',
    description: 'Manage team and view reports',
    permissions: ['dashboard', 'manager-dashboard', 'team', 'verifications-control', 'reports', 'salary', 'work-time-control', 'leave-requests'],
    isSystem: false,
  },
  'employee': {
    name: 'Employee',
    description: 'Basic employee access',
    permissions: ['dashboard', 'attendance', 'salary', 'profile', 'work-session', 'verification'],
    isSystem: false,
  },
};

interface PermissionsContextType {
  roles: Role[];
  joinRequests: JoinRequest[];
  loading: boolean;
  createRole: (name: string, description: string, permissions: string[]) => Promise<void>;
  updateRole: (roleId: string, permissions: string[]) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  hasPermission: (userPermissions: string[], permissionId: string) => boolean;
  approveJoinRequest: (requestId: string, roleId: string) => Promise<void>;
  rejectJoinRequest: (requestId: string) => Promise<void>;
  submitJoinRequest: (request: Omit<JoinRequest, 'id' | 'requestedAt' | 'status'>) => void;
  getPermissionsForRole: (roleId: string) => string[];
  promoteUserToCeo: (userId: string) => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch roles and user counts from database
  const fetchRoles = async () => {
    if (!user?.companyId) {
      // Return empty for users without company
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch user counts per role from user_roles table
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, user_id')
        .in('user_id', (await supabase
          .from('users')
          .select('id')
          .eq('company_id', user.companyId)
          .then(res => (res.data || []).map(u => u.id))));

      if (rolesError) throw rolesError;

      // Count users per role
      const roleCounts: Record<string, number> = {};
      (userRolesData || []).forEach((ur: any) => {
        if (ur.role) {
          roleCounts[ur.role] = (roleCounts[ur.role] || 0) + 1;
        }
      });


      // Fetch custom roles from database ONLY
      const { data: customRolesData, error: customRolesError } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('company_id', user.companyId);

      if (customRolesError) {
        console.error('Error fetching custom roles:', customRolesError);
        setRoles([]);
        setLoading(false);
        return;
      }

      // Fetch permissions for custom roles
      const customRoleIds = (customRolesData || []).map((r: any) => r.id);
      let customRolePermissions: any[] = [];

      if (customRoleIds.length > 0) {
        const { data: permsData } = await supabase
          .from('custom_role_permissions')
          .select('*')
          .in('role_id', customRoleIds);
        customRolePermissions = permsData || [];
      }

      // Build ALL roles from custom_roles table
      const allRoles = (customRolesData || []).map((role: any) => ({
        id: role.id,
        name: role.name,
        description: role.description || '',
        permissions: customRolePermissions
          .filter((p: any) => p.role_id === role.id)
          .map((p: any) => p.permission_key),
        userCount: roleCounts[role.id] || 0,
        isSystem: false,
        canPromoteToCeo: false,
      }));

      setRoles(allRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch join requests (company applications)
  const fetchJoinRequests = async () => {
    if (!user?.companyId) return;

    try {
      const { data, error } = await supabase
        .from('company_applications')
        .select(`
          id,
          user_id,
          status,
          created_at,
          users!company_applications_user_id_fkey (
            full_name,
            email
          )
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const requests: JoinRequest[] = (data || []).map((app: any) => ({
        id: app.id,
        userId: app.user_id,
        userName: app.users?.full_name || 'Unknown',
        userEmail: app.users?.email || '',
        message: 'Requested to join the company',
        requestedAt: new Date(app.created_at),
        status: app.status as 'pending' | 'approved' | 'rejected',
      }));

      setJoinRequests(requests);
    } catch (error) {
      console.error('Error fetching join requests:', error);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchJoinRequests();
  }, [user?.companyId]);

  const refreshRoles = async () => {
    await fetchRoles();
  };

  const createRole = async (name: string, description: string, permissions: string[]) => {
    if (!user?.companyId) return;

    try {
      // Generate a unique role ID
      const roleId = `custom-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

      // Create custom role
      const { error: roleError } = await supabase
        .from('custom_roles')
        .insert({
          id: roleId,
          company_id: user.companyId,
          name,
          description,
        });

      if (roleError) {
        console.error('Role insert error:', roleError);
        throw roleError;
      }

      // Save permissions for this custom role
      if (permissions.length > 0) {
        const permData = permissions.map(perm => ({
          role_id: roleId,
          permission_key: perm,
        }));

        const { error: permError } = await supabase
          .from('custom_role_permissions')
          .insert(permData);

        if (permError) {
          console.error('Permissions insert error:', permError);
          // Rollback: delete the role if permissions fail
          await supabase.from('custom_roles').delete().eq('id', roleId);
          throw permError;
        }
      }

      // Refresh roles from database
      await fetchRoles();
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  };

  const updateRole = async (roleId: string, permissions: string[]) => {
    if (!user?.companyId) return;

    try {
      // Delete existing permissions for this custom role
      const { error: deleteError } = await supabase
        .from('custom_role_permissions')
        .delete()
        .eq('role_id', roleId);

      if (deleteError) throw deleteError;

      // Insert new permissions
      if (permissions.length > 0) {
        const permData = permissions.map(perm => ({
          role_id: roleId,
          permission_key: perm,
        }));

        const { error: insertError } = await supabase
          .from('custom_role_permissions')
          .insert(permData);

        if (insertError) throw insertError;
      }

      // Update local state
      setRoles(roles.map(role =>
        role.id === roleId ? { ...role, permissions } : role
      ));
    } catch (error) {
      console.error('Error updating role permissions:', error);
      throw error;
    }
  };

  const deleteRole = async (roleId: string) => {
    if (!user?.companyId) return;

    try {
      // Delete from database - cascade will delete permissions too
      const { error } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', roleId)
        .eq('company_id', user.companyId);

      if (error) throw error;

      // Refresh roles
      await fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  };

  const hasPermission = (userPermissions: string[], permissionId: string): boolean => {
    if (userPermissions.includes('all')) return true;
    return userPermissions.includes(permissionId);
  };

  const approveJoinRequest = async (requestId: string, roleId: string) => {
    if (!user?.companyId) return;

    try {
      const request = joinRequests.find(r => r.id === requestId);
      if (!request) return;

      // Use handle_application RPC which correctly handles user_roles
      const { data, error } = await (supabase.rpc as any)('handle_application', {
        p_application_id: requestId,
        p_action: 'approve',
        p_role: roleId,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve application');
      }

      // Update local state
      setJoinRequests(requests =>
        requests.map(req =>
          req.id === requestId
            ? { ...req, status: 'approved' as const, assignedRole: roleId }
            : req
        )
      );

      await fetchRoles(); // Refresh user counts
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  };

  const rejectJoinRequest = async (requestId: string) => {
    try {
      const client = supabase as any;
      await client
        .from('company_applications')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      setJoinRequests(requests =>
        requests.map(req =>
          req.id === requestId ? { ...req, status: 'rejected' as const } : req
        )
      );
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  };

  const submitJoinRequest = (request: Omit<JoinRequest, 'id' | 'requestedAt' | 'status'>) => {
    const newRequest: JoinRequest = {
      ...request,
      id: `jr-${Date.now()}`,
      requestedAt: new Date(),
      status: 'pending',
    };
    setJoinRequests([...joinRequests, newRequest]);
  };

  const getPermissionsForRole = (roleId: string): string[] => {
    const role = roles.find(r => r.id === roleId);
    return role?.permissions || [];
  };

  const promoteUserToCeo = async (userId: string) => {
    try {
      // Remove existing roles and assign CEO role via user_roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'ceo' as AppRole } as any);

      await fetchRoles();
    } catch (error) {
      console.error('Error promoting user to CEO:', error);
      throw error;
    }
  };

  return (
    <PermissionsContext.Provider
      value={{
        roles,
        joinRequests,
        loading,
        createRole,
        updateRole,
        deleteRole,
        hasPermission,
        approveJoinRequest,
        rejectJoinRequest,
        submitJoinRequest,
        getPermissionsForRole,
        promoteUserToCeo,
        refreshRoles,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
