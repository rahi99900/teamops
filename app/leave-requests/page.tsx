'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useState, useEffect, useCallback } from 'react';
import { Clock, Check, X, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

// Create untyped client for flexible queries
const supabaseUrl = 'https://kpxwsipodybqrxvbmpun.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtweHdzaXBvZHlicXJ4dmJtcHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5Njk2MzksImV4cCI6MjA4MjU0NTYzOX0.xndeXhTX1Sd_hyfXCV1aO4zy1lOSFlwkm70lOjpY8bI';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

interface LeaveRequest {
  id: string;
  user_id: string;
  employee_name: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function LeaveRequests() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaveRequests = useCallback(async () => {
    if (!user?.companyId) return;

    try {
      // Fetch leave requests
      const { data: requests, error } = await supabaseClient
        .from('leave_requests')
        .select('*')
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user names
      const userIds = [...new Set((requests || []).map(r => r.user_id))];
      const { data: users } = await supabaseClient
        .from('users')
        .select('id, full_name')
        .in('id', userIds);

      const userMap = new Map((users || []).map(u => [u.id, u.full_name]));

      const formattedRequests: LeaveRequest[] = (requests || []).map(req => ({
        id: req.id,
        user_id: req.user_id,
        employee_name: userMap.get(req.user_id) || 'Unknown',
        from_date: req.from_date,
        to_date: req.to_date,
        reason: req.reason,
        status: req.status,
        created_at: req.created_at,
      }));

      setLeaveRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    if (user?.companyId) {
      fetchLeaveRequests();
    }
  }, [user?.companyId, fetchLeaveRequests]);

  const pendingRequests = leaveRequests.filter(r => r.status === 'pending');
  const approvedRequests = leaveRequests.filter(r => r.status === 'approved');
  const rejectedRequests = leaveRequests.filter(r => r.status === 'rejected');

  const handleApprove = async (requestId: string, employeeName: string) => {
    try {
      const { error } = await supabaseClient
        .from('leave_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (error) throw error;

      setLeaveRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: 'approved' as const } : req
        )
      );

      toast({
        title: 'Leave Approved',
        description: `${employeeName}'s leave request has been approved.`,
      });
    } catch (error) {
      console.error('Error approving leave:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve leave request.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (requestId: string, employeeName: string) => {
    try {
      const { error } = await supabaseClient
        .from('leave_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      setLeaveRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: 'rejected' as const } : req
        )
      );

      toast({
        title: 'Leave Rejected',
        description: `${employeeName}'s leave request has been rejected.`,
      });
    } catch (error) {
      console.error('Error rejecting leave:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject leave request.',
        variant: 'destructive',
      });
    }
  };

  const renderRequestCard = (request: LeaveRequest, showActions = false) => (
    <Card key={request.id} className="hover:shadow-card transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {request.employee_name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{request.employee_name}</h3>
              <Badge
                variant={
                  request.status === 'approved' ? 'default' :
                    request.status === 'rejected' ? 'destructive' : 'secondary'
                }
              >
                {request.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{request.reason}</p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(request.from_date), 'MMM d')} - {format(new Date(request.to_date), 'MMM d, yyyy')}
              </span>
              <span>
                Requested: {format(new Date(request.created_at), 'MMM d, h:mm a')}
              </span>
            </div>
            {showActions && request.status === 'pending' && (
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={() => handleApprove(request.id, request.employee_name)}
                  className="gap-1"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(request.id, request.employee_name)}
                  className="gap-1"
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
        <div>
          <h1 className="text-2xl font-bold">Leave Requests</h1>
          <p className="text-muted-foreground">Manage employee leave requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-success/10">
                  <Check className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedRequests.length}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <X className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rejectedRequests.length}</p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <User className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending leave requests</p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map(req => renderRequestCard(req, true))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Check className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No approved requests</p>
                </CardContent>
              </Card>
            ) : (
              approvedRequests.map(req => renderRequestCard(req))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <X className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No rejected requests</p>
                </CardContent>
              </Card>
            ) : (
              rejectedRequests.map(req => renderRequestCard(req))
            )}
          </TabsContent>
        </Tabs>
      </div>

    </ProtectedLayout>
  );
}
