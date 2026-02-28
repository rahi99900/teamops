'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Building2,
  Briefcase,
  Calendar,
  Edit,
  Camera,
  Save,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

// Create untyped client for flexible queries
const supabaseUrl = 'https://kpxwsipodybqrxvbmpun.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtweHdzaXBvZHlicXJ4dmJtcHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5Njk2MzksImV4cCI6MjA4MjU0NTYzOX0.xndeXhTX1Sd_hyfXCV1aO4zy1lOSFlwkm70lOjpY8bI';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

interface ProfileStats {
  daysPresent: number;
  lateArrivals: number;
  leaveTaken: number;
  overtimeMinutes: number;
}

export default function MyProfile() {
  const { user, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({
    daysPresent: 0,
    lateArrivals: 0,
    leaveTaken: 0,
    overtimeMinutes: 0,
  });
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  useEffect(() => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;

      try {
        // Get this month's start date
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        // Fetch work sessions for stats
        const { data: sessions } = await supabaseClient
          .from('work_sessions')
          .select('work_date, total_minutes')
          .eq('user_id', user.id);

        const daysPresent = new Set((sessions || []).map((s: any) => s.work_date)).size;
        const overtimeMinutes = (sessions || []).reduce((sum: number, s: any) => {
          const dailyMinutes = s.total_minutes || 0;
          return sum + Math.max(0, dailyMinutes - 480); // 8 hours = 480 minutes
        }, 0);

        // Fetch approved leave count
        const { count: leaveCount } = await supabaseClient
          .from('leave_requests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'approved');

        setStats({
          daysPresent,
          lateArrivals: 0, // Would need clock-in time comparison
          leaveTaken: leaveCount || 0,
          overtimeMinutes,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      const { error } = await supabaseClient
        .from('users')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUserData();
      setIsEditing(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const profileStats = [
    { label: 'Days Present', value: stats.daysPresent.toString(), icon: Calendar },
    { label: 'Leave Taken', value: stats.leaveTaken.toString(), icon: Calendar },
    { label: 'Overtime', value: formatMinutes(stats.overtimeMinutes), icon: Calendar },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedLayout>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <p className="text-muted-foreground mt-2">
              Manage your personal information and preferences.
            </p>
          </div>
          <Button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className={isEditing ? 'gap-2' : 'gap-2'}
            variant={isEditing ? 'default' : 'outline'}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit className="h-4 w-4" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl border-4 border-card shadow-md">
                    {formData.firstName[0]}{formData.lastName[0]}
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <h2 className="text-xl font-bold mt-4">
                  {formData.firstName} {formData.lastName}
                </h2>
                <p className="text-muted-foreground text-sm capitalize">{user?.role || 'Employee'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Active
                  </span>
                </div>
              </div>

              {/* Quick Info */}
              <div className="space-y-4 border-t border-border pt-6">
                {user?.companyName && (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Company</p>
                      <p className="text-sm font-medium">{user.companyName}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm font-medium capitalize">{user?.role || 'Employee'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              {profileStats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card rounded-xl p-4 shadow-sm border border-border"
                >
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Details Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-accent/30">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="h-11 pl-10 bg-accent/50"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-accent/30">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Employment Information
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company"
                      value={user?.companyName || 'Not assigned'}
                      disabled
                      className="h-11 pl-10 bg-accent/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="role"
                      value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Employee'}
                      disabled
                      className="h-11 pl-10 bg-accent/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeId">User ID</Label>
                  <Input
                    id="employeeId"
                    value={user?.id?.slice(0, 8) || '-'}
                    disabled
                    className="h-11 bg-accent/50 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </ProtectedLayout>
  );
}
