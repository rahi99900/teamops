'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useState, useEffect, useCallback } from 'react';
import { Download, Calendar, Users, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function Reports() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('this-week');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalEmployees: 0,
    avgAttendance: 0,
    totalHours: 0,
    overtimeHours: 0,
  });

  const [attendanceData, setAttendanceData] = useState<{ day: string; present: number; absent: number; late: number }[]>([]);
  const [hoursData, setHoursData] = useState<{ week: string; hours: number; target: number }[]>([]);
  const [departmentData, setDepartmentData] = useState<{ name: string; value: number; color: string }[]>([]);

  const fetchReportData = useCallback(async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get total employees
      const { count: empCount } = (await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)) as any;

      // Get attendance records for the period
      const daysAgo = period === 'today' ? 1 : period === 'this-week' ? 7 : period === 'this-month' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data: attRecords } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0]);

      // Calculate stats
      const presentCount = (attRecords || []).filter((r: any) => r.status === 'present').length;
      const lateCount = (attRecords || []).filter((r: any) => r.status === 'late').length;
      const absentCount = (attRecords || []).filter((r: any) => r.status === 'absent').length;
      const totalRecords = presentCount + lateCount + absentCount;
      const avgAtt = totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 100) : 0;

      const totalHrs = (attRecords || []).reduce((sum: number, r: any) => sum + (r.total_hours || 0), 0);
      const expectedHours = (empCount || 0) * 8 * daysAgo;
      const overtime = Math.max(0, totalHrs - expectedHours);

      setStats({
        totalEmployees: empCount || 0,
        avgAttendance: avgAtt,
        totalHours: Math.round(totalHrs),
        overtimeHours: Math.round(overtime),
      });

      // Generate daily attendance chart data
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const attChartData = days.map(day => {
        const dayRecords = (attRecords || []).filter((r: any) => {
          const recordDay = new Date(r.date).toLocaleDateString('en-US', { weekday: 'short' });
          return recordDay.startsWith(day.substring(0, 2));
        });
        return {
          day,
          present: dayRecords.filter((r: any) => r.status === 'present').length,
          absent: dayRecords.filter((r: any) => r.status === 'absent').length,
          late: dayRecords.filter((r: any) => r.status === 'late').length,
        };
      });
      setAttendanceData(attChartData);

      // Generate weekly hours data
      const weeksData = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekRecords = (attRecords || []).filter((r: any) => {
          const recordDate = new Date(r.date);
          return recordDate >= weekStart && recordDate < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        });
        const weekHours = weekRecords.reduce((sum: number, r: any) => sum + (r.total_hours || 0), 0);
        weeksData.push({
          week: `Week ${4 - i}`,
          hours: Math.round(weekHours),
          target: (empCount || 0) * 40,
        });
      }
      setHoursData(weeksData);

      // Get department distribution
      const { data: users } = await supabase
        .from('users')
        .select('department')
        .eq('company_id', user.companyId);

      const deptCounts: Record<string, number> = {};
      (users || []).forEach((u: any) => {
        const dept = u.department || 'Unassigned';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });

      const colors = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];
      const deptData = Object.entries(deptCounts).map(([name, value], i) => ({
        name,
        value,
        color: colors[i % colors.length],
      }));
      setDepartmentData(deptData);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.companyId, period]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ProtectedLayout>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">Insights into workforce performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary-light">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Attendance</p>
                  <p className="text-2xl font-bold">{stats.avgAttendance}%</p>
                </div>
                <div className="p-2 rounded-lg bg-success-light">
                  <Calendar className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold">{stats.totalHours.toLocaleString()}h</p>
                </div>
                <div className="p-2 rounded-lg bg-warning-light">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overtime Hours</p>
                  <p className="text-2xl font-bold">{stats.overtimeHours}h</p>
                </div>
                <div className="p-2 rounded-lg bg-destructive-light">
                  <TrendingUp className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance</CardTitle>
              <CardDescription>Attendance breakdown by day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="present" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="late" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span className="text-sm text-muted-foreground">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-warning" />
                  <span className="text-sm text-muted-foreground">Late</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive" />
                  <span className="text-sm text-muted-foreground">Absent</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hours Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Hours</CardTitle>
              <CardDescription>Total hours worked vs target</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hoursData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="week" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-sm text-muted-foreground">Actual</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-6 bg-muted-foreground" style={{ borderTop: '2px dashed' }} />
                  <span className="text-sm text-muted-foreground">Target</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Distribution by Department</CardTitle>
            <CardDescription>Breakdown of employees across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="h-64 w-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                {departmentData.map((dept) => (
                  <div key={dept.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: dept.color }}
                    />
                    <div>
                      <p className="font-medium">{dept.name}</p>
                      <p className="text-sm text-muted-foreground">{dept.value} employees</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </ProtectedLayout>
  );
}
