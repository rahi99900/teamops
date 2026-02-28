'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { PermissionGuard } from '@/components/guards/PermissionGuard'
import { useState, useEffect } from 'react';
import { Calendar, Clock, Download, ChevronRight, CheckCircle, List, Grid, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge, StatusType } from '@/components/ui/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AttendanceRecord {
  id: string;
  date: string;
  dayLabel: string;
  dateNum: string;
  month: string;
  checkIn: string;
  checkOut: string;
  breakTime: string;
  totalHours: string;
  status: StatusType;
}

export default function MyAttendance() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMinutes: 0,
    daysPresent: 0,
    leaveTaken: 0,
  });

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user?.id) return;

      try {
        // Fetch work sessions for current month
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { data: sessions, error } = await supabase
          .from('work_sessions')
          .select('*')
          .eq('user_id', user.id)
          .gte('work_date', monthStart.toISOString().split('T')[0])
          .order('work_date', { ascending: false });

        if (error) throw error;

        const records: AttendanceRecord[] = (sessions || []).map((s: any) => {
          const date = new Date(s.work_date);
          const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

          return {
            id: s.id,
            date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
            dayLabel: days[date.getDay()],
            dateNum: date.getDate().toString(),
            month: months[date.getMonth()],
            checkIn: s.start_time ? new Date(s.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
            checkOut: s.end_time ? new Date(s.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
            breakTime: '0m', // Would need to calculate from break_sessions
            totalHours: s.total_minutes ? `${Math.floor(s.total_minutes / 60)}h ${(s.total_minutes % 60).toString().padStart(2, '0')}m` : (s.status === 'working' ? 'In Progress' : '0h 00m'),
            status: s.status === 'working' ? 'working' as StatusType : 'on-time' as StatusType,
          };
        });

        setAttendanceRecords(records);

        // Calculate stats
        const totalMinutes = (sessions || []).reduce((sum: number, s: any) => sum + (s.total_minutes || 0), 0);
        const daysPresent = new Set((sessions || []).map((s: any) => s.work_date)).size;

        // Fetch leave count
        const { count: leaveCount } = await supabase
          .from('leave_requests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .gte('from_date', monthStart.toISOString().split('T')[0]);

        setStats({
          totalMinutes,
          daysPresent,
          leaveTaken: leaveCount || 0,
        });
      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [user?.id]);

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedLayout>
      <PermissionGuard permission="attendance">

        <div className="space-y-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <a href="/dashboard" className="hover:text-primary transition-colors">Home</a>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">My Attendance</span>
          </nav>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">My Attendance</h1>
              <p className="text-muted-foreground">Manage and view your daily work logs and history.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Request Leave
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Hours Worked"
              value={formatHours(stats.totalMinutes)}
              subtitle="this month"
              icon={Clock}
              iconColor="primary"
            />
            <StatCard
              title="Days Present"
              value={stats.daysPresent.toString()}
              subtitle="Days"
              icon={CheckCircle}
              iconColor="success"
            />
            <StatCard
              title="Leave Taken"
              value={stats.leaveTaken.toString()}
              subtitle="Day(s)"
              icon={Calendar}
              iconColor="warning"
            />
          </div>

          {/* Filters & Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="text-sm text-muted-foreground">
                Showing {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <List className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <Grid className="h-5 w-5" />
                </button>
              </div>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            {attendanceRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-accent/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Check In</th>
                      <th className="px-6 py-4 font-semibold">Check Out</th>
                      <th className="px-6 py-4 font-semibold">Break Time</th>
                      <th className="px-6 py-4 font-semibold">Total Hours</th>
                      <th className="px-6 py-4 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attendanceRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-6 py-4 font-medium whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center h-10 w-10 rounded-lg bg-accent text-xs font-bold text-muted-foreground">
                              <span>{record.month}</span>
                              <span className="text-base text-foreground">{record.dateNum}</span>
                            </div>
                            <span className="font-medium">{record.date}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{record.checkIn}</td>
                        <td className="px-6 py-4 text-muted-foreground">{record.checkOut}</td>
                        <td className="px-6 py-4 text-muted-foreground">{record.breakTime}</td>
                        <td className="px-6 py-4 font-medium">{record.totalHours}</td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={record.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No attendance records found for this month. Start a work session to begin tracking.
              </div>
            )}
          </div>
        </div>

      </PermissionGuard>
    </ProtectedLayout>
  );
}
