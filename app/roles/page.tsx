'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Plus, Edit, Trash2, Users, Check, X, Save, ChevronDown, ChevronRight,
  UserMinus, Loader2, UserCheck, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { usePermissions, allPermissions } from '@/contexts/PermissionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RoleMember {
  id: string;
  full_name: string;
  email: string;
  role_id: string;
}

export default function RoleManagement() {
  const { roles, createRole, updateRole, deleteRole, refreshRoles } = usePermissions();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [roleMembers, setRoleMembers] = useState<Record<string, RoleMember[]>>({});
  const [loadingMembers, setLoadingMembers] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<{ userId: string; roleId: string; name: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // ── Fetch members for a role ──────────────────────────────────────────────
  const fetchRoleMembers = useCallback(async (roleId: string) => {
    if (!user?.companyId) return;
    setLoadingMembers(roleId);
    try {
      // Step 1: Get all user IDs in this company
      const { data: companyUsers } = await supabase
        .from('users')
        .select('id')
        .eq('company_id', user.companyId);
      const companyUserIds = (companyUsers || []).map((u: any) => u.id);

      if (companyUserIds.length === 0) {
        setRoleMembers(prev => ({ ...prev, [roleId]: [] }));
        return;
      }

      // Step 2: Find user IDs that match this role (by id or by name)
      const { data: roleAssignments } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', companyUserIds);

      // Match by role.id (exact) OR role.name (case-insensitive) to handle both naming styles
      const role = roles.find(r => r.id === roleId);
      const matchedUserIds = (roleAssignments || []).filter((ur: any) => {
        const urRole = (ur.role || '').toLowerCase();
        return urRole === roleId.toLowerCase() || (role && urRole === role.name.toLowerCase());
      }).map((ur: any) => ur.user_id);

      if (matchedUserIds.length === 0) {
        setRoleMembers(prev => ({ ...prev, [roleId]: [] }));
        return;
      }

      // Step 3: Fetch user details for those IDs
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', matchedUserIds);

      setRoleMembers(prev => ({
        ...prev,
        [roleId]: (users || []).map((u: any) => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          role_id: roleId,
        })),
      }));
    } catch (err) {
      console.error('Error fetching role members:', err);
      setRoleMembers(prev => ({ ...prev, [roleId]: [] }));
    } finally {
      setLoadingMembers(null);
    }
  }, [user?.companyId, roles]);

  // Only CEO can access this page — check AFTER all hooks
  if (user?.role !== 'ceo') {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground">Only the CEO can manage roles and permissions.</p>
            </CardContent>
          </Card>
        </div>
      </ProtectedLayout>
    );
  }

  // ── Toggle expand role card to show members ───────────────────────────────
  const handleToggleExpand = (roleId: string) => {
    if (expandedRole === roleId) {
      setExpandedRole(null);
    } else {
      setExpandedRole(roleId);
      if (!roleMembers[roleId]) {
        fetchRoleMembers(roleId);
      }
    }
  };

  // ── Remove member from role (reset to unassigned) ─────────────────────────
  const handleRemoveMember = async () => {
    if (!removingMember) return;
    setIsRemoving(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'unassigned' })
        .eq('user_id', removingMember.userId);

      if (error) throw error;

      // Also update users table role
      await supabase
        .from('users')
        .update({ role: 'unassigned' } as any)
        .eq('id', removingMember.userId);

      toast({
        title: 'Member Removed',
        description: `${removingMember.name} has been removed from this role and set to unassigned.`,
      });

      // Refresh members list
      setRoleMembers(prev => ({
        ...prev,
        [removingMember.roleId]: (prev[removingMember.roleId] || []).filter(
          m => m.id !== removingMember.userId
        ),
      }));
      await refreshRoles();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to remove member.', variant: 'destructive' });
    } finally {
      setIsRemoving(false);
      setRemovingMember(null);
    }
  };

  // ── Permissions edit ──────────────────────────────────────────────────────
  const handleEditPermissions = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      setSelectedRole(roleId);
      setEditingPermissions([...role.permissions]);
      setIsPermissionDialogOpen(true);
    }
  };

  const togglePermission = (permissionId: string) => {
    setEditingPermissions(prev =>
      prev.includes(permissionId) ? prev.filter(p => p !== permissionId) : [...prev, permissionId]
    );
  };

  const handleSavePermissions = () => {
    if (selectedRole) {
      updateRole(selectedRole, editingPermissions);
      toast({ title: 'Permissions Updated', description: 'Role permissions have been saved.' });
      setIsPermissionDialogOpen(false);
      setSelectedRole(null);
    }
  };

  // ── Create role ───────────────────────────────────────────────────────────
  const toggleNewRolePermission = (permissionId: string) => {
    setNewRolePermissions(prev =>
      prev.includes(permissionId) ? prev.filter(p => p !== permissionId) : [...prev, permissionId]
    );
  };

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      toast({ title: 'Error', description: 'Please enter a role name.', variant: 'destructive' });
      return;
    }
    try {
      await createRole(newRole.name, newRole.description, newRolePermissions);
      toast({ title: 'Role Created', description: `"${newRole.name}" role has been created.` });
      setIsCreateDialogOpen(false);
      setNewRole({ name: '', description: '' });
      setNewRolePermissions([]);
    } catch {
      toast({ title: 'Error', description: 'Failed to create role.', variant: 'destructive' });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteRole(roleId);
      toast({ title: 'Role Deleted', description: 'The role has been removed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete role.', variant: 'destructive' });
    }
  };

  const selectedRoleData = roles.find(r => r.id === selectedRole);

  const getRoleColor = (roleId: string) => {
    if (roleId === 'ceo') return 'bg-amber-500/10 text-amber-600 border-amber-200';
    if (roleId === 'manager') return 'bg-blue-500/10 text-blue-600 border-blue-200';
    if (roleId === 'admin') return 'bg-purple-500/10 text-purple-600 border-purple-200';
    return 'bg-primary/10 text-primary border-primary/20';
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Role Management</h1>
            <p className="text-muted-foreground">Create roles, assign permissions, and manage members</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        </div>

        {/* Roles List */}
        <div className="space-y-3">
          {roles.map((role) => {
            const members = roleMembers[role.id] || [];
            const isExpanded = expandedRole === role.id;
            const isLoadingThis = loadingMembers === role.id;

            return (
              <Card key={role.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="p-0">
                  {/* Role Header */}
                  <div className="flex items-center gap-4 p-5">
                    {/* Icon + Name */}
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${getRoleColor(role.id)} shrink-0`}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{role.name}</h3>
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-xs">System</Badge>
                        )}
                        <Badge variant="outline" className="text-xs gap-1">
                          <Users className="h-3 w-3" />
                          {role.userCount} {role.userCount === 1 ? 'member' : 'members'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{role.description}</p>
                    </div>

                    {/* Permissions preview */}
                    <div className="hidden md:flex flex-wrap gap-1 max-w-xs">
                      {role.permissions.includes('all') ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Full Access</span>
                      ) : (
                        <>
                          {role.permissions.slice(0, 3).map(perm => (
                            <span key={perm} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {allPermissions.find(p => p.id === perm)?.label || perm}
                            </span>
                          ))}
                          {role.permissions.length > 3 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              +{role.permissions.length - 3} more
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {role.id !== 'ceo' && (
                        <Button variant="outline" size="sm" onClick={() => handleEditPermissions(role.id)} className="gap-1.5">
                          <Edit className="h-3.5 w-3.5" />
                          Permissions
                        </Button>
                      )}
                      {!role.isSystem && (
                        <Button
                          variant="ghost" size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {/* Expand/collapse members */}
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => handleToggleExpand(role.id)}
                        className="gap-1.5 text-muted-foreground"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        Members
                      </Button>
                    </div>
                  </div>

                  {/* Members Panel */}
                  {isExpanded && (
                    <div className="border-t border-border bg-accent/30 px-5 py-4">
                      {isLoadingThis ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">Loading members...</span>
                        </div>
                      ) : members.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                          <AlertCircle className="h-8 w-8 mb-2 opacity-40" />
                          <p className="text-sm">No members assigned to this role</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                            {members.length} {members.length === 1 ? 'Member' : 'Members'}
                          </p>
                          {members.map(member => (
                            <div
                              key={member.id}
                              className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
                            >
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                  {member.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{member.full_name}</p>
                                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                              </div>
                              <Badge className={`text-xs shrink-0 ${getRoleColor(role.id)}`}>
                                {role.name}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                                onClick={() => setRemovingMember({ userId: member.id, roleId: role.id, name: member.full_name })}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Permissions Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Permissions Matrix</CardTitle>
            <CardDescription>Overview of all role permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Permission</th>
                    {roles.map((role) => (
                      <th key={role.id} className="text-center py-3 px-4 font-medium">{role.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allPermissions.map((permission) => (
                    <tr key={permission.id} className="border-b border-border hover:bg-accent/30">
                      <td className="py-2.5 px-4">
                        <div>
                          <p className="font-medium">{permission.label}</p>
                          {permission.route && <p className="text-xs text-muted-foreground">{permission.route}</p>}
                        </div>
                      </td>
                      {roles.map((role) => (
                        <td key={role.id} className="text-center py-2.5 px-4">
                          {role.permissions.includes('all') || role.permissions.includes(permission.id) ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── Remove Member Confirm Dialog ── */}
        <AlertDialog open={!!removingMember} onOpenChange={(open) => !open && setRemovingMember(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove from Role?</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>{removingMember?.name}</strong> will be removed from this role and their role will be set to <strong>unassigned</strong>. They will lose access to all role-based pages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleRemoveMember}
                disabled={isRemoving}
              >
                {isRemoving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserMinus className="h-4 w-4 mr-2" />}
                Remove Member
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Edit Permissions Dialog ── */}
        <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Permissions: {selectedRoleData?.name}</DialogTitle>
              <DialogDescription>Select which features and pages this role can access</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{editingPermissions.length} permissions selected</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingPermissions(allPermissions.map(p => p.id))}>Select All</Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingPermissions([])}>Clear All</Button>
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                {allPermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50">
                    <div className="flex-1">
                      <Label className="font-medium">{permission.label}</Label>
                      <p className="text-xs text-muted-foreground">{permission.description}
                        {permission.route && <span className="ml-1 text-primary">{permission.route}</span>}
                      </p>
                    </div>
                    <Switch checked={editingPermissions.includes(permission.id)} onCheckedChange={() => togglePermission(permission.id)} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSavePermissions}><Save className="h-4 w-4 mr-1" />Save Permissions</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Create Role Dialog ── */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>Define a new role with custom permissions</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name</Label>
                <Input id="roleName" placeholder="e.g., Team Lead" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleDesc">Description</Label>
                <Textarea id="roleDesc" placeholder="Describe what this role is for..." value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} rows={2} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">{newRolePermissions.length} permissions selected</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" type="button" onClick={() => setNewRolePermissions(allPermissions.map(p => p.id))}>Select All</Button>
                    <Button variant="outline" size="sm" type="button" onClick={() => setNewRolePermissions([])}>Clear All</Button>
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                  {allPermissions.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50">
                      <div className="flex-1">
                        <Label className="font-medium">{permission.label}</Label>
                        <p className="text-xs text-muted-foreground">{permission.description}
                          {permission.route && <span className="ml-1 text-primary">{permission.route}</span>}
                        </p>
                      </div>
                      <Switch checked={newRolePermissions.includes(permission.id)} onCheckedChange={() => toggleNewRolePermission(permission.id)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateRole}><Plus className="h-4 w-4 mr-1" />Create Role</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedLayout>
  );
}
