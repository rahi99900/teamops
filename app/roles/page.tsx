'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Users, Check, X, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { usePermissions, allPermissions } from '@/contexts/PermissionsContext';
import { useAuth } from '@/contexts/AuthContext';

export default function RoleManagement() {
  const { roles, createRole, updateRole, deleteRole } = usePermissions();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);

  // Only CEO can access this page
  if (user?.role !== 'ceo') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              Only the CEO can manage roles and permissions.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSavePermissions = () => {
    if (selectedRole) {
      updateRole(selectedRole, editingPermissions);
      toast({
        title: 'Permissions Updated',
        description: `Role permissions have been saved.`,
      });
      setIsPermissionDialogOpen(false);
      setSelectedRole(null);
    }
  };

  const toggleNewRolePermission = (permissionId: string) => {
    setNewRolePermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a role name.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createRole(newRole.name, newRole.description, newRolePermissions);

      toast({
        title: 'Role Created',
        description: `"${newRole.name}" role has been created successfully.`,
      });

      setIsCreateDialogOpen(false);
      setNewRole({ name: '', description: '' });
      setNewRolePermissions([]);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteRole(roleId);
      toast({
        title: 'Role Deleted',
        description: 'The role has been removed successfully.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const selectedRoleData = roles.find(r => r.id === selectedRole);

  return (
    <ProtectedLayout>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Role Management</h1>
            <p className="text-muted-foreground">Create roles and assign permissions (CEO Only)</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        </div>

        {/* Roles List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <Card key={role.id} className="hover:shadow-card transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${role.id === 'ceo' ? 'bg-warning/20' : 'bg-primary-light'}`}>
                      <Shield className={`h-5 w-5 ${role.id === 'ceo' ? 'text-warning' : 'text-primary'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{role.name}</h3>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                  {role.isSystem && (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      System
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {role.permissions.includes('all') ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-warning/20 text-warning font-medium">
                      Full Access
                    </span>
                  ) : (
                    role.permissions.slice(0, 4).map(perm => (
                      <span key={perm} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {allPermissions.find(p => p.id === perm)?.label || perm}
                      </span>
                    ))
                  )}
                  {!role.permissions.includes('all') && role.permissions.length > 4 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      +{role.permissions.length - 4} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {role.userCount} users
                  </div>
                  <div className="flex gap-2">
                    {role.id !== 'ceo' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPermissions(role.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Permissions
                      </Button>
                    )}
                    {!role.isSystem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Permissions Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Permissions Matrix</CardTitle>
            <CardDescription>Overview of all role permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Permission</th>
                    {roles.map((role) => (
                      <th key={role.id} className="text-center py-3 px-4 font-medium text-sm">
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allPermissions.map((permission) => (
                    <tr key={permission.id} className="border-b border-border">
                      <td className="py-3 px-4 text-sm">{permission.label}</td>
                      {roles.map((role) => (
                        <td key={role.id} className="text-center py-3 px-4">
                          {role.permissions.includes('all') ||
                            role.permissions.includes(permission.id) ? (
                            <Check className="h-5 w-5 text-success mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />
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

        {/* Edit Permissions Dialog */}
        <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Permissions: {selectedRoleData?.name}</DialogTitle>
              <DialogDescription>
                Select which features and pages this role can access
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* All Permissions - Single Dynamic List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Select Permissions ({editingPermissions.length} selected)
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPermissions(allPermissions.map(p => p.id))}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPermissions([])}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {allPermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <Label className="font-medium cursor-pointer">
                          {permission.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {permission.description}
                          {permission.route && (
                            <span className="ml-2 text-xs text-primary">
                              {permission.route}
                            </span>
                          )}
                        </p>
                      </div>
                      <Switch
                        checked={editingPermissions.includes(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePermissions}>
                <Save className="h-4 w-4 mr-1" />
                Save Permissions
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Role Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role with custom permissions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roleName">Role Name</Label>
                  <Input
                    id="roleName"
                    placeholder="e.g., Team Lead"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleDesc">Description</Label>
                  <Textarea
                    id="roleDesc"
                    placeholder="Describe what this role is for..."
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              {/* Permissions Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Select Permissions ({newRolePermissions.length} selected)
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => setNewRolePermissions(allPermissions.map(p => p.id))}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => setNewRolePermissions([])}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {allPermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <Label className="font-medium cursor-pointer">
                          {permission.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {permission.description}
                          {permission.route && (
                            <span className="ml-2 text-xs text-primary">
                              {permission.route}
                            </span>
                          )}
                        </p>
                      </div>
                      <Switch
                        checked={newRolePermissions.includes(permission.id)}
                        onCheckedChange={() => toggleNewRolePermission(permission.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole}>
                <Plus className="h-4 w-4 mr-1" />
                Create Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

    </ProtectedLayout>
  );
}
