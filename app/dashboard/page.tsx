'use client'

import { useState, useEffect } from 'react';
import { Calendar, Clock, Play, TrendingUp, Loader2, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';;
import { supabase } from '@/integrations/supabase/client';

interface WorkStats {
  weekMinutes: number;
  monthMinutes: number;
  monthDays: number;
  overtimeMinutes: number;
}

interface AttendanceRecord {
  date: string;
  clockIn: string;
  clockOut: string;
  hours: string;
  status: 'working' | 'complete' | 'holiday';
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<WorkStats>({
    weekMinutes: 0,
    monthMinutes: 0,
    monthDays: 0,
    overtimeMinutes: 0,
  });
  const [recentActivity, setRecentActivity] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;

      try {
        // Check for active work session
        const { data: activeSession } = await supabase
          .from('work_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'working')
          .maybeSingle();

        setHasActiveSession(!!activeSession);

        // Get recent work sessions
        const { data: sessions } = await supabase
          .from('work_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('work_date', { ascending: false })
          .limit(5);

        if (sessions) {
          const activity: AttendanceRecord[] = sessions.map((s: any) => ({
            date: new Date(s.work_date).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            }),
            clockIn: s.start_time ? new Date(s.start_time).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : '-',
            clockOut: s.end_time ? new Date(s.end_time).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : '-',
            hours: s.total_minutes ? `${Math.floor(s.total_minutes / 60)}h ${s.total_minutes % 60}m` : (s.status === 'working' ? 'In Progress' : '0h 00m'),
            status: s.status === 'working' ? 'working' : 'complete',
          }));
          setRecentActivity(activity);
        }

        // Calculate weekly stats (current week)
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const { data: weekData } = await supabase
          .from('work_sessions')
          .select('total_minutes')
          .eq('user_id', user.id)
          .gte('work_date', weekStart.toISOString().split('T')[0]);

        const weekMinutes = weekData?.reduce((sum: number, s: any) => sum + (s.total_minutes || 0), 0) || 0;

        // Calculate monthly stats
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { data: monthData } = await supabase
          .from('work_sessions')
          .select('total_minutes, work_date')
          .eq('user_id', user.id)
          .gte('work_date', monthStart.toISOString().split('T')[0]);

        const monthMinutes = monthData?.reduce((sum: number, s: any) => sum + (s.total_minutes || 0), 0) || 0;
        const monthDays = new Set(monthData?.map((s: any) => s.work_date)).size || 0;

        // Overtime = anything over 8 hours per day
        const overtimeMinutes = monthData?.reduce((sum: number, s: any) => {
          const dailyMinutes = s.total_minutes || 0;
          return sum + Math.max(0, dailyMinutes - 480); // 480 = 8 hours
        }, 0) || 0;

        setStats({
          weekMinutes,
          monthMinutes,
          monthDays,
          overtimeMinutes,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  const getCurrentDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  const weeklyProgress = Math.min((stats.weekMinutes / 2400) * 100, 100); // 40 hours = 2400 minutes

  // Show message if user has no company
  if (!user?.companyId) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="p-6 rounded-full bg-muted mb-6">
            <Building2 className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Company Yet</h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Please join a company first to access your dashboard and start tracking your work time.
          </p>
          <Button asChild>
            <Link href="/company-apply">Join a Company</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const quickStats = [
    { label: 'This Week', value: formatMinutes(stats.weekMinutes), sublabel: 'of 40h goal', progress: weeklyProgress },
    { label: 'This Month', value: formatMinutes(stats.monthMinutes), sublabel: `${stats.monthDays} days worked`, progress: Math.min((stats.monthMinutes / 9600) * 100, 100) },
    { label: 'Overtime', value: formatMinutes(stats.overtimeMinutes), sublabel: 'this month', progress: Math.min((stats.overtimeMinutes / 600) * 100, 100) },
  ];

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.firstName || 'there'}
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {getCurrentDate()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-card border border-border rounded-lg shadow-sm flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Company</span>
              <span className="text-sm font-bold">{user?.companyName || 'My Company'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action - Start Work Session */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {hasActiveSession ? 'Work Session Active' : 'Ready to Start Your Day?'}
            </h2>
            <p className="text-primary-foreground/80">
              {hasActiveSession 
                ? 'You have an active work session. Continue tracking your hours.'
                : 'Clock in with photo verification to begin tracking your work hours.'}
            </p>
          </div>
          <Button size="lg" variant="secondary" asChild className="shadow-lg hover:scale-105 transition-transform">
            <Link href="/work-session">
              <Play className="h-5 w-5 mr-2" />
              {hasActiveSession ? 'View Session' : 'Start Work Session'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickStats.map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <span className="text-xs text-muted-foreground">{stat.sublabel}</span>
            </div>
            <div className="text-3xl font-bold mb-3">{stat.value}</div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${stat.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-2xl shadow-sm border border-border">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-lg">Recent Activity</h3>
              <Button variant="link" className="text-primary p-0 h-auto" asChild>
                <Link href="/attendance">View All</Link>
              </Button>
            </div>
            <div className="divide-y divide-border">
              {recentActivity.length > 0 ? (
                recentActivity.map((day, index) => (
                  <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm font-bold">{day.date}</div>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <div className="text-xs text-muted-foreground">Clock In</div>
                          <div className="text-sm font-medium">{day.clockIn}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Clock Out</div>
                          <div className="text-sm font-medium">{day.clockOut}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${
                        day.status === 'working' ? 'text-green-500' : 'text-foreground'
                      }`}>
                        {day.hours}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-muted-foreground">
                  No work sessions yet. Start your first work session to see activity here.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Weekly Progress */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <h3 className="font-bold text-lg mb-6">Weekly Progress</h3>
            <div className="flex items-center justify-center mb-6">
              <div className="relative h-40 w-40">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-primary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${weeklyProgress}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{Math.floor(stats.weekMinutes / 60)}h</span>
                  <span className="text-xs text-muted-foreground font-medium">of 40h Goal</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-accent">
                <span className="text-sm text-muted-foreground">Overtime</span>
                <span className="text-sm font-bold">{formatMinutes(stats.overtimeMinutes)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-accent">
                <span className="text-sm text-muted-foreground">Remaining</span>
                <span className="text-sm font-bold">{formatMinutes(Math.max(0, 2400 - stats.weekMinutes))}</span>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="bg-gradient-to-br from-primary/10 to-card rounded-2xl p-6 border border-primary/10">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-card text-primary shadow-sm shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Welcome to {user?.companyName}</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Track your work hours, manage attendance, and stay productive with TeamOps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
