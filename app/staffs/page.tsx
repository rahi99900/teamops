'use client'

import { useState, useEffect, useCallback } from 'react';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { PermissionGuard } from '@/components/guards/PermissionGuard';
import {
    Search, Users, Mail, Phone, Briefcase, Shield,
    Loader2, Building2, Calendar, Clock, Edit2, Check, X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { supabase } from '@/integrations/supabase/client';

interface StaffMember {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    role: string;          // fetched from user_roles
    position?: string;
    department?: string;
    is_active: boolean;
    created_at: string;
    company_id: string;
}

interface WorkStats {
    totalSessions: number;
    totalHours: number;
    lastActive: string | null;
}

export default function StaffsPage() {
    const { user } = useAuth();
    const { roles, refreshRoles } = usePermissions();
    const { toast } = useToast();

    const [staffs, setStaffs] = useState<StaffMember[]>([]);
    const [filtered, setFiltered] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [workStats, setWorkStats] = useState<WorkStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [editingRole, setEditingRole] = useState(false);
    const [newRole, setNewRole] = useState('');
    const [isSavingRole, setIsSavingRole] = useState(false);

    // ── Fetch all staff with their roles ───────────────────────────────────
    const fetchStaffs = useCallback(async () => {
        if (!user?.companyId) return;
        setIsLoading(true);
        try {
            // Step 1: Fetch all users in company
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, full_name, email, is_active, created_at, company_id')
                .eq('company_id', user.companyId)
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;
            const userList = usersData || [];

            // Step 2: Fetch all their role assignments in one query
            const userIds = userList.map((u: any) => u.id);
            let roleMap: Record<string, string> = {};

            if (userIds.length > 0) {
                const { data: roleData } = await supabase
                    .from('user_roles')
                    .select('user_id, role')
                    .in('user_id', userIds);

                (roleData || []).forEach((ur: any) => {
                    roleMap[ur.user_id] = (ur.role || 'unassigned').toString();
                });
            }

            // Merge role into each user
            const merged: StaffMember[] = userList.map((u: any) => ({
                id: u.id,
                full_name: u.full_name || 'Unknown',
                email: u.email,
                is_active: u.is_active ?? true,
                created_at: u.created_at,
                company_id: u.company_id,
                role: roleMap[u.id] || 'unassigned',
                phone: u.phone,
                position: u.position,
                department: u.department,
            }));

            setStaffs(merged);
            setFiltered(merged);
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [user?.companyId]);

    useEffect(() => { fetchStaffs(); }, [fetchStaffs]);

    // ── Filter on search/role change ────────────────────────────────────────
    useEffect(() => {
        let result = staffs;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(s =>
                s.full_name?.toLowerCase().includes(q) ||
                s.email?.toLowerCase().includes(q) ||
                s.position?.toLowerCase().includes(q) ||
                s.department?.toLowerCase().includes(q) ||
                s.role?.toLowerCase().includes(q)
            );
        }
        if (roleFilter !== 'all') {
            result = result.filter(s => s.role === roleFilter);
        }
        setFiltered(result);
    }, [search, roleFilter, staffs]);

    // ── Work stats for selected staff ───────────────────────────────────────
    const fetchWorkStats = useCallback(async (staffId: string) => {
        setIsLoadingStats(true);
        try {
            const { data } = await supabase
                .from('work_sessions')
                .select('total_minutes, work_date')
                .eq('user_id', staffId)
                .order('work_date', { ascending: false });

            const totalSessions = data?.length || 0;
            const totalMinutes = (data || []).reduce((sum: number, s: any) => sum + (s.total_minutes || 0), 0);
            const lastSession = data?.[0];

            setWorkStats({
                totalSessions,
                totalHours: Math.round(totalMinutes / 60 * 10) / 10,
                lastActive: lastSession ? new Date(lastSession.work_date).toLocaleDateString() : null,
            });
        } catch {
            setWorkStats(null);
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    const handleOpenProfile = (staff: StaffMember) => {
        setSelectedStaff(staff);
        setNewRole(staff.role);
        setEditingRole(false);
        fetchWorkStats(staff.id);
    };

    // ── Save role change ─────────────────────────────────────────────────────
    const handleSaveRole = async () => {
        if (!selectedStaff || !newRole) return;
        setIsSavingRole(true);
        try {
            // Find the role to get its base name
            const roleObj = roles.find(r => r.id === newRole);
            const baseRoleName = roleObj ? roleObj.name.toLowerCase() : (newRole === 'unassigned' ? 'unassigned' : 'employee');

            const { error } = await supabase
                .from('user_roles')
                .update({ role: baseRoleName } as any)
                .eq('user_id', selectedStaff.id);

            if (error) throw error;

            toast({ title: 'Role Updated', description: `${selectedStaff.full_name}'s role changed to ${newRole}.` });

            setStaffs(prev => prev.map(s => s.id === selectedStaff.id ? { ...s, role: newRole } : s));
            setSelectedStaff(prev => prev ? { ...prev, role: newRole } : null);
            setEditingRole(false);
            await refreshRoles();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsSavingRole(false);
        }
    };

    const getRoleBadgeStyle = (role: string) => {
        switch ((role || '').toLowerCase()) {
            case 'ceo': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'manager': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'hr': return 'bg-pink-100 text-pink-700 border-pink-200';
            case 'unassigned': return 'bg-muted text-muted-foreground border-border';
            default: return 'bg-primary/10 text-primary border-primary/20';
        }
    };

    const getInitials = (name: string) =>
        (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    // All unique role values across current staff (for filter dropdown)
    const uniqueRoles = [...new Set(staffs.map(s => s.role).filter(Boolean))];

    return (
        <ProtectedLayout>
            <PermissionGuard permission={['staffs', 'team']}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">Staff Management</h1>
                            <p className="text-muted-foreground">{staffs.length} total members in your company</p>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-medium">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                {staffs.filter(s => s.is_active).length} Active
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium">
                                {staffs.filter(s => s.role === 'unassigned').length} Unassigned
                            </span>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, role..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 h-10"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[160px] h-10">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                {uniqueRoles.map(role => (
                                    <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Staff Grid */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Users className="h-12 w-12 mb-3 opacity-30" />
                            <p className="font-medium">No staff found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map(staff => (
                                <Card
                                    key={staff.id}
                                    className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30 group"
                                    onClick={() => handleOpenProfile(staff)}
                                >
                                    <CardContent className="p-5">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-12 w-12 shrink-0">
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                                    {getInitials(staff.full_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{staff.full_name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{staff.email}</p>
                                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${getRoleBadgeStyle(staff.role)}`}>
                                                        {staff.role || 'unassigned'}
                                                    </span>
                                                    {staff.position && (
                                                        <span className="text-xs text-muted-foreground truncate">{staff.position}</span>
                                                    )}
                                                </div>
                                                {staff.department && (
                                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                        <Building2 className="h-3 w-3 shrink-0" />
                                                        {staff.department}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* ── Staff Profile Dialog ── */}
                    <Dialog open={!!selectedStaff} onOpenChange={(open) => !open && setSelectedStaff(null)}>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Staff Profile</DialogTitle>
                            </DialogHeader>

                            {selectedStaff && (
                                <div className="space-y-6">
                                    {/* Header */}
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16">
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                                                {getInitials(selectedStaff.full_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="text-xl font-bold">{selectedStaff.full_name}</h3>
                                            <p className="text-muted-foreground text-sm">{selectedStaff.email}</p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${getRoleBadgeStyle(selectedStaff.role)}`}>
                                                    {selectedStaff.role || 'unassigned'}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedStaff.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                                                    {selectedStaff.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedStaff.phone && (
                                            <div className="rounded-lg bg-accent/50 p-3">
                                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                    <Mail className="h-3.5 w-3.5" />
                                                    <span className="text-xs font-medium">Phone</span>
                                                </div>
                                                <p className="text-sm font-medium">{selectedStaff.phone}</p>
                                            </div>
                                        )}
                                        {selectedStaff.position && (
                                            <div className="rounded-lg bg-accent/50 p-3">
                                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                    <Briefcase className="h-3.5 w-3.5" />
                                                    <span className="text-xs font-medium">Position</span>
                                                </div>
                                                <p className="text-sm font-medium">{selectedStaff.position}</p>
                                            </div>
                                        )}
                                        {selectedStaff.department && (
                                            <div className="rounded-lg bg-accent/50 p-3">
                                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                    <Building2 className="h-3.5 w-3.5" />
                                                    <span className="text-xs font-medium">Department</span>
                                                </div>
                                                <p className="text-sm font-medium">{selectedStaff.department}</p>
                                            </div>
                                        )}
                                        <div className="rounded-lg bg-accent/50 p-3">
                                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span className="text-xs font-medium">Joined</span>
                                            </div>
                                            <p className="text-sm font-medium">
                                                {new Date(selectedStaff.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Work Stats */}
                                    <div>
                                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-primary" />
                                            Work Statistics
                                        </h4>
                                        {isLoadingStats ? (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="text-center rounded-lg bg-primary/5 border border-primary/10 p-3">
                                                    <p className="text-2xl font-bold text-primary">{workStats?.totalSessions ?? 0}</p>
                                                    <p className="text-xs text-muted-foreground">Sessions</p>
                                                </div>
                                                <div className="text-center rounded-lg bg-primary/5 border border-primary/10 p-3">
                                                    <p className="text-2xl font-bold text-primary">{workStats?.totalHours ?? 0}h</p>
                                                    <p className="text-xs text-muted-foreground">Total Hours</p>
                                                </div>
                                                <div className="text-center rounded-lg bg-primary/5 border border-primary/10 p-3">
                                                    <p className="text-sm font-bold text-primary">{workStats?.lastActive || '—'}</p>
                                                    <p className="text-xs text-muted-foreground">Last Active</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Role Edit */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-primary" />
                                                Role Assignment
                                            </h4>
                                            {!editingRole && (
                                                <Button variant="ghost" size="sm" onClick={() => setEditingRole(true)} className="gap-1.5 h-7">
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                    Edit Role
                                                </Button>
                                            )}
                                        </div>

                                        {editingRole ? (
                                            <div className="space-y-3">
                                                <Select value={newRole} onValueChange={setNewRole}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                                        {roles.map(role => (
                                                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <div className="flex gap-2">
                                                    <Button onClick={handleSaveRole} disabled={isSavingRole} size="sm" className="gap-2">
                                                        {isSavingRole ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                                        Save
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => { setEditingRole(false); setNewRole(selectedStaff.role); }}>
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium capitalize ${getRoleBadgeStyle(selectedStaff.role)}`}>
                                                <Shield className="h-3.5 w-3.5" />
                                                {selectedStaff.role || 'unassigned'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </PermissionGuard>
        </ProtectedLayout>
    );
}
