'use client'

import { useState, useEffect, useCallback } from 'react';
import {
    Search, Users, Mail, Phone, Briefcase, Shield, ChevronRight,
    Loader2, UserCog, X, Save, Building2, Calendar, Clock, Edit2, Check
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
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
    role: string;
    position?: string;
    department?: string;
    is_active: boolean;
    created_at: string;
    avatar_url?: string;
    company_id: string;
}

interface StaffStats {
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
    const [staffStats, setStaffStats] = useState<StaffStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [editingRole, setEditingRole] = useState(false);
    const [newRole, setNewRole] = useState('');
    const [isSavingRole, setIsSavingRole] = useState(false);

    // Fetch all staff for this company
    const fetchStaffs = useCallback(async () => {
        if (!user?.companyId) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('company_id', user.companyId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStaffs((data || []) as StaffMember[]);
            setFiltered((data || []) as StaffMember[]);
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [user?.companyId]);

    useEffect(() => { fetchStaffs(); }, [fetchStaffs]);

    // Filter staff on search/role change
    useEffect(() => {
        let result = staffs;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(s =>
                s.full_name?.toLowerCase().includes(q) ||
                s.email?.toLowerCase().includes(q) ||
                s.position?.toLowerCase().includes(q) ||
                s.department?.toLowerCase().includes(q)
            );
        }
        if (roleFilter !== 'all') {
            result = result.filter(s => s.role === roleFilter);
        }
        setFiltered(result);
    }, [search, roleFilter, staffs]);

    // Fetch stats when a staff member is selected
    const fetchStaffStats = useCallback(async (staffId: string) => {
        setIsLoadingStats(true);
        try {
            const { data } = await supabase
                .from('work_sessions')
                .select('total_minutes, work_date, status')
                .eq('user_id', staffId)
                .order('work_date', { ascending: false });

            const totalSessions = data?.length || 0;
            const totalMinutes = data?.reduce((sum: number, s: any) => sum + (s.total_minutes || 0), 0) || 0;
            const lastSession = data?.[0];

            setStaffStats({
                totalSessions,
                totalHours: Math.round(totalMinutes / 60 * 10) / 10,
                lastActive: lastSession ? new Date(lastSession.work_date).toLocaleDateString() : null,
            });
        } catch {
            setStaffStats(null);
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    const handleOpenProfile = (staff: StaffMember) => {
        setSelectedStaff(staff);
        setNewRole(staff.role);
        setEditingRole(false);
        fetchStaffStats(staff.id);
    };

    // Save role change
    const handleSaveRole = async () => {
        if (!selectedStaff || !newRole) return;
        setIsSavingRole(true);
        try {
            // Update user_roles table
            const { error: roleError } = await supabase
                .from('user_roles')
                .update({ role: newRole })
                .eq('user_id', selectedStaff.id);

            if (roleError) throw roleError;

            // Update users table
            await supabase
                .from('users')
                .update({ role: newRole } as any)
                .eq('id', selectedStaff.id);

            toast({ title: 'Role Updated', description: `${selectedStaff.full_name}'s role has been changed to ${newRole}.` });

            // Update local state
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
        switch (role) {
            case 'ceo': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'manager': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'hr': return 'bg-pink-100 text-pink-700 border-pink-200';
            case 'unassigned': return 'bg-muted text-muted-foreground';
            default: return 'bg-primary/10 text-primary border-primary/20';
        }
    };

    const getInitials = (name: string) =>
        name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    // Get all unique roles from current staff for filter dropdown
    const uniqueRoles = [...new Set(staffs.map(s => s.role).filter(Boolean))];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Staff Management</h1>
                    <p className="text-muted-foreground">{staffs.length} total members in your company</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    {/* Stats pills */}
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
                        placeholder="Search by name, email, position..."
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

            {/* Staff List */}
            {filtered.length === 0 ? (
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
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-semibold truncate">{staff.full_name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{staff.email}</p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors mt-0.5" />
                                        </div>
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
                                                <Building2 className="h-3 w-3" />
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
                            {/* Profile Header */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                                        {getInitials(selectedStaff.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedStaff.full_name}</h3>
                                    <p className="text-muted-foreground text-sm">{selectedStaff.email}</p>
                                    <div className="flex items-center gap-2 mt-1">
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
                                            <Phone className="h-3.5 w-3.5" />
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
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading stats...
                                    </div>
                                ) : staffStats ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center rounded-lg bg-primary/5 border border-primary/10 p-3">
                                            <p className="text-2xl font-bold text-primary">{staffStats.totalSessions}</p>
                                            <p className="text-xs text-muted-foreground">Sessions</p>
                                        </div>
                                        <div className="text-center rounded-lg bg-primary/5 border border-primary/10 p-3">
                                            <p className="text-2xl font-bold text-primary">{staffStats.totalHours}h</p>
                                            <p className="text-xs text-muted-foreground">Total Hours</p>
                                        </div>
                                        <div className="text-center rounded-lg bg-primary/5 border border-primary/10 p-3">
                                            <p className="text-sm font-bold text-primary">{staffStats.lastActive || '—'}</p>
                                            <p className="text-xs text-muted-foreground">Last Active</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No work session data found.</p>
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
                                                Cancel
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
    );
}
