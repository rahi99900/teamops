'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Calendar, Clock, Camera, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: number | null;
  status: string;
}

interface VerificationLog {
  id: string;
  created_at: string;
  type: string;
  status: string;
  photo_url: string | null;
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [verifications, setVerifications] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlySummary, setMonthlySummary] = useState({
    workDays: 22,
    daysWorked: 0,
    totalHours: 0,
    overtime: 0,
    absences: 0,
    lateArrivals: 0,
  });

  const fetchEmployeeData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch employee details
      const { data: empData, error: empError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (empError) throw empError;
      setEmployee(empData);

      // Fetch attendance records
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: attData, error: attError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(10);

      if (attError) throw attError;
      setAttendance(attData || []);

      // Calculate monthly summary
      const daysWorked = (attData || []).filter((a: any) => a.status === 'present' || a.status === 'late').length;
      const totalHours = (attData || []).reduce((sum: number, a: any) => sum + (a.total_hours || 0), 0);
      const lateArrivals = (attData || []).filter((a: any) => a.status === 'late').length;
      const absences = (attData || []).filter((a: any) => a.status === 'absent').length;

      setMonthlySummary({
        workDays: 22,
        daysWorked,
        totalHours: Math.round(totalHours),
        overtime: Math.max(0, Math.round(totalHours - (daysWorked * 8))),
        absences,
        lateArrivals,
      });

      // Fetch verification logs
      const { data: verData, error: verError } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (verError) throw verError;
      setVerifications(verData || []);

    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employee data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (id) {
      fetchEmployeeData();
    }
  }, [id, fetchEmployeeData]);

  const handleRequestVerification = async () => {
    if (!id || !user?.id) return;

    try {
      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: id,
          requested_by: user.id,
          type: 'manager_request',
          status: 'pending',
        } as any);

      if (error) throw error;

      toast({
        title: 'Verification Requested',
        description: 'A verification request has been sent to the employee.',
      });

      fetchEmployeeData();
    } catch (error) {
      console.error('Error requesting verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to request verification.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Employee not found.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/team">Back to Team</Link>
        </Button>
      </div>
    );
  }

  const avatar = `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`;
  const attendanceRate = monthlySummary.workDays > 0
    ? Math.round((monthlySummary.daysWorked / monthlySummary.workDays) * 100)
    : 0;

  return (
    <ProtectedLayout>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/team">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Employee Details</h1>
            <p className="text-muted-foreground">View and manage employee information</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-primary-light flex items-center justify-center text-primary text-3xl font-bold">
                {avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{employee.first_name} {employee.last_name}</h2>
                  <StatusBadge status="working" />
                </div>
                <p className="text-muted-foreground">{employee.position || 'No position'} • {employee.department || 'No department'}</p>
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {employee.email}
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {employee.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined {format(new Date(employee.created_at), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2" onClick={handleRequestVerification}>
                  <Camera className="h-4 w-4" />
                  Request Verification
                </Button>
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-primary">{monthlySummary.daysWorked}/{monthlySummary.workDays}</div>
              <p className="text-sm text-muted-foreground">Days Worked</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold">{monthlySummary.totalHours}h</div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-success">{monthlySummary.overtime}h</div>
              <p className="text-sm text-muted-foreground">Overtime</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-destructive">{monthlySummary.absences}</div>
              <p className="text-sm text-muted-foreground">Absences</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-warning">{monthlySummary.lateArrivals}</div>
              <p className="text-sm text-muted-foreground">Late Arrivals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-success">{attendanceRate}%</div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="attendance">Attendance History</TabsTrigger>
            <TabsTrigger value="verifications">Verifications</TabsTrigger>
            <TabsTrigger value="info">Personal Info</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No attendance records found.</p>
                ) : (
                  <div className="space-y-3">
                    {attendance.map((record: any) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="font-semibold">{new Date(record.date).getDate()}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm">
                                <Clock className="inline h-4 w-4 mr-1 text-muted-foreground" />
                                In: {record.clock_in ? format(new Date(record.clock_in), 'HH:mm') : '-'}
                              </span>
                              <span className="text-sm">
                                <Clock className="inline h-4 w-4 mr-1 text-muted-foreground" />
                                Out: {record.clock_out ? format(new Date(record.clock_out), 'HH:mm') : '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{record.total_hours ? `${record.total_hours.toFixed(1)}h` : '-'}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${record.status === 'present'
                              ? 'bg-success-light text-success'
                              : record.status === 'late'
                                ? 'bg-warning-light text-warning'
                                : record.status === 'absent'
                                  ? 'bg-destructive-light text-destructive'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                          >
                            {record.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verifications">
            <Card>
              <CardHeader>
                <CardTitle>Verification Logs</CardTitle>
              </CardHeader>
              <CardContent>
                {verifications.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No verification logs found.</p>
                ) : (
                  <div className="space-y-3">
                    {verifications.map((log: any) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-primary-light">
                            <Camera className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium capitalize">{(log.type || '').replace('_', ' ')}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(log.created_at), 'MMM d, yyyy')} at {format(new Date(log.created_at), 'h:mm a')}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full capitalize ${log.status === 'verified' || log.status === 'approved'
                            ? 'bg-success-light text-success'
                            : log.status === 'pending'
                              ? 'bg-warning-light text-warning'
                              : 'bg-destructive-light text-destructive'
                            }`}
                        >
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{employee.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{employee.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{employee.department || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Position</p>
                      <p className="font-medium">{employee.position || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Join Date</p>
                      <p className="font-medium">{format(new Date(employee.created_at), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

    </ProtectedLayout>
  );
}
