'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';;
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  Camera,
  FileText,
  TrendingUp,
  ChevronRight,
  Bell,
  Coffee,
  CheckCircle2,
  XCircle,
  Timer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge, StatusType } from '@/components/ui/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

// Create untyped client for flexible queries
const supabaseUrl = 'https://kpxwsipodybqrxvbmpun.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtweHdzaXBvZHlicXJ4dmJtcHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5Njk2MzksImV4cCI6MjA4MjU0NTYzOX0.xndeXhTX1Sd_hyfXCV1aO4zy1lOSFlwkm70lOjpY8bI';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  position: string;
  status: 'working' | 'on-break' | 'offline' | 'pending';
  startTime?: string;
  hoursToday: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'error';
  message: string;
  time: string;
  employeeName?: string;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'working' | 'on-break' | 'offline'>('all');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({
    avgHours: 0,
    onTimeRate: 0,
    verifications: 0,
    pendingVerifications: 0,
  });

  const fetchTeamData = useCallback(async () => {
    if (!user?.companyId) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch employees
      const { data: employees } = await supabaseClient
        .from('users')
        .select('id, full_name, email')
        .eq('company_id', user.companyId)
        .eq('is_active', true);

      if (!employees || employees.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch today's work sessions
      const { data: sessions } = await supabaseClient
        .from('work_sessions')
        .select('*')
        .eq('company_id', user.companyId)
        .eq('work_date', today);

      // Fetch user roles
      const { data: roles } = await supabaseClient
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', employees.map((e: any) => e.id));

      // Map employees to team members
      const members: TeamMember[] = employees.map((emp: any) => {
        const session = sessions?.find((s: any) => s.user_id === emp.id);
        const role = roles?.find((r: any) => r.user_id === emp.id);
        const initials = emp.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase();

        let status: TeamMember['status'] = 'offline';
        let hoursToday = 0;
        let startTime: string | undefined;

        if (session) {
          if (session.status === 'working') {
            status = 'working';
            startTime = format(new Date(session.start_time), 'h:mm a');
            const start = new Date(session.start_time);
            hoursToday = (Date.now() - start.getTime()) / (1000 * 60 * 60);
          } else if (session.total_minutes) {
            hoursToday = session.total_minutes / 60;
          }
        }

        return {
          id: emp.id,
          name: emp.full_name,
          avatar: initials,
          position: role?.role || 'Employee',
          status,
          startTime,
          hoursToday: Math.round(hoursToday * 10) / 10,
        };
      });

      setTeamMembers(members);

      // Calculate stats
      const workingSessions = sessions?.filter((s: any) => s.status === 'working') || [];
      const totalHours = members.reduce((sum, m) => sum + m.hoursToday, 0);
      const workingMembers = members.filter(m => m.hoursToday > 0);
      const avgHours = workingMembers.length > 0 ? totalHours / workingMembers.length : 0;

      // Fetch verification requests
      const { data: verifications } = await supabaseClient
        .from('verification_requests')
        .select('*')
        .eq('company_id', user.companyId)
        .gte('created_at', today);

      const pendingVerifications = verifications?.filter((v: any) => v.status === 'pending').length || 0;

      setTodayStats({
        avgHours: Math.round(avgHours * 10) / 10,
        onTimeRate: members.length > 0 ? Math.round((workingSessions.length / members.length) * 100) : 0,
        verifications: verifications?.length || 0,
        pendingVerifications,
      });

      // Fetch recent alerts
      const { data: leaveRequests } = await supabaseClient
        .from('leave_requests')
        .select('id, user_id, created_at, status')
        .eq('company_id', user.companyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      const alertsList: Alert[] = [];

      if (leaveRequests) {
        for (const req of leaveRequests as any[]) {
          const emp = employees.find((e: any) => e.id === req.user_id);
          alertsList.push({
            id: req.id,
            type: 'info',
            message: 'Leave request pending',
            time: format(new Date(req.created_at), 'h:mm a'),
            employeeName: emp?.full_name,
          });
        }
      }

      setAlerts(alertsList);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    if (user?.companyId) {
      fetchTeamData();
    }
  }, [user?.companyId, fetchTeamData]);

  const stats = {
    totalTeam: teamMembers.length,
    working: teamMembers.filter(m => m.status === 'working').length,
    onBreak: teamMembers.filter(m => m.status === 'on-break').length,
    offline: teamMembers.filter(m => m.status === 'offline').length,
  };

  const filteredMembers = selectedFilter === 'all'
    ? teamMembers
    : teamMembers.filter(m => m.status === selectedFilter);

  const getStatusIcon = (status: TeamMember['status']) => {
    switch (status) {
      case 'working': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'on-break': return <Coffee className="h-4 w-4 text-warning" />;
      case 'offline': return <XCircle className="h-4 w-4 text-muted-foreground" />;
      case 'pending': return <Timer className="h-4 w-4 text-primary" />;
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manager Dashboard</h1>
        <p className="text-muted-foreground">Monitor your team&apos;s attendance and productivity</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Team" value={stats.totalTeam} icon={Users} iconColor="primary" />
        <StatCard title="Working Now" value={stats.working} icon={UserCheck} iconColor="success" />
        <StatCard title="On Break" value={stats.onBreak} icon={Coffee} iconColor="warning" />
        <StatCard title="Offline" value={stats.offline} icon={UserX} iconColor="destructive" />
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => router.push('/verification-control')}>
              <Camera className="h-5 w-5 text-primary" /><span className="text-xs">Request Verification</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => router.push('/reports')}>
              <FileText className="h-5 w-5 text-primary" /><span className="text-xs">Generate Report</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => router.push('/team')}>
              <Clock className="h-5 w-5 text-primary" /><span className="text-xs">View Team</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => router.push('/leave-requests')}>
              <TrendingUp className="h-5 w-5 text-primary" /><span className="text-xs">Leave Requests</span>
            </Button>
          </div >
        </CardContent >
      </Card >

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">Team Status</CardTitle>
              <div className="flex gap-2">
                {(['all', 'working', 'on-break', 'offline'] as const).map((filter) => (
                  <Button key={filter} variant={selectedFilter === filter ? 'default' : 'outline'} size="sm" onClick={() => setSelectedFilter(filter)} className="capitalize">{filter}</Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50 cursor-pointer" onClick={() => router.push(`/employee/${member.id}`)}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-primary text-sm">{member.avatar}</AvatarFallback></Avatar>
                    <div><p className="font-medium text-foreground">{member.name}</p><p className="text-xs text-muted-foreground capitalize">{member.position}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5">{getStatusIcon(member.status)}<StatusBadge status={member.status as StatusType} /></div>
                      {member.hoursToday > 0 && <p className="text-xs text-muted-foreground mt-0.5">{member.hoursToday}h today</p>}
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
            {filteredMembers.length === 0 && <div className="py-8 text-center text-muted-foreground">No team members match this filter</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between"><CardTitle className="text-lg">Recent Alerts</CardTitle><Badge variant="secondary">{alerts.length}</Badge></div>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground"><Bell className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No alerts</p></div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                    <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{alert.message}</p>
                      {alert.employeeName && <p className="text-xs text-muted-foreground">{alert.employeeName}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="mt-4 w-full" onClick={() => router.push('/leave-requests')}>View All Alerts</Button>
          </CardContent>
        </Card >
      </div >

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Today&apos;s Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-accent/50 p-4"><p className="text-sm text-muted-foreground">Average Hours</p><p className="text-2xl font-bold text-foreground">{todayStats.avgHours || 0}h</p></div>
            <div className="rounded-lg bg-accent/50 p-4"><p className="text-sm text-muted-foreground">Active Rate</p><p className="text-2xl font-bold text-foreground">{todayStats.onTimeRate}%</p></div>
            <div className="rounded-lg bg-accent/50 p-4"><p className="text-sm text-muted-foreground">Verifications</p><p className="text-2xl font-bold text-foreground">{todayStats.verifications}</p></div>
            <div className="rounded-lg bg-accent/50 p-4"><p className="text-sm text-muted-foreground">Team Members</p><p className="text-2xl font-bold text-foreground">{stats.totalTeam}</p></div>
          </div>
        </CardContent>
      </Card>
    </div >
  );
}
