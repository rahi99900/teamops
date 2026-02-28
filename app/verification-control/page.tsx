'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useState, useEffect, useCallback } from 'react';
import { Camera, Send, Clock, Check, X, RefreshCw, ClipboardCheck, Image as ImageIcon, Video, Eye, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  name: string;
  avatar: string;
  status: 'working' | 'on-break' | 'offline';
}

interface VerificationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  avatar: string;
  requestTime: string;
  status: 'pending' | 'completed' | 'skipped' | 'expired';
  submittedAt?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  response?: {
    status: 'approved' | 'rejected';
    comment?: string;
    respondedAt: Date;
  };
}

export default function VerificationControl() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [viewDetailRequest, setViewDetailRequest] = useState<VerificationRequest | null>(null);
  const [comment, setComment] = useState('');
  const [isMediaFullscreen, setIsMediaFullscreen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user?.companyId) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch employees
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('company_id', user.companyId)
        .eq('is_active', true);

      // Fetch today's work sessions
      const { data: sessions } = await supabase
        .from('work_sessions')
        .select('user_id, status')
        .eq('company_id', user.companyId)
        .eq('work_date', today);

      const employeeList: Employee[] = (usersData || []).map(u => {
        const session = sessions?.find((s: any) => s.user_id === u.id);
        return {
          id: u.id,
          name: u.full_name,
          avatar: u.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
          status: session?.status === 'working' ? 'working' as const : 'offline' as const,
        };
      });

      setEmployees(employeeList);

      // Fetch verification requests
      const { data: verifications } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('company_id', user.companyId)
        .gte('created_at', today)
        .order('created_at', { ascending: false });

      const userIds = [...new Set((verifications || []).map((v: any) => v.user_id))];
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', userIds);

      const userMap = new Map((users || []).map((u: any) => [u.id, u.full_name]));

      const requestsList: VerificationRequest[] = (verifications || []).map((v: any) => {
        const userName = userMap.get(v.user_id) || 'Unknown';
        return {
          id: v.id,
          employeeId: v.user_id,
          employeeName: userName,
          avatar: userName.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
          requestTime: format(new Date(v.created_at), 'HH:mm'),
          status: v.status,
          submittedAt: v.submitted_at ? format(new Date(v.submitted_at), 'HH:mm') : undefined,
          mediaUrl: v.media_url,
          mediaType: v.media_type,
          response: v.reviewer_comment || v.reviewed_at ? {
            status: v.response_status || 'approved',
            comment: v.reviewer_comment,
            respondedAt: v.reviewed_at ? new Date(v.reviewed_at) : new Date(),
          } : undefined,
        };
      });

      setRequests(requestsList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    if (user?.companyId) {
      fetchData();
    }
  }, [user?.companyId, fetchData]);

  const handleSendRequest = async () => {
    if (!selectedEmployee || !user?.companyId) {
      toast({
        title: 'Select an employee',
        description: 'Please select an employee to send verification request.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const employee = employees.find((e) => e.id === selectedEmployee);

      const { error } = await supabase
        .from('verification_requests')
        .insert({
          company_id: user.companyId,
          user_id: selectedEmployee,
          requested_by: user.id,
          verification_type: 'photo',
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Verification request sent',
        description: `Request sent to ${employee?.name}`,
      });
      setSelectedEmployee('');
      await fetchData();
    } catch (error) {
      console.error('Error sending request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send verification request.',
        variant: 'destructive',
      });
    }
  };

  const handleSendToAll = async () => {
    if (!user?.companyId) return;

    const workingEmployees = employees.filter((e) => e.status === 'working');

    if (workingEmployees.length === 0) {
      toast({
        title: 'No working employees',
        description: 'There are no employees currently working.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const insertData = workingEmployees.map(emp => ({
        company_id: user.companyId!,
        user_id: emp.id,
        requested_by: user.id,
        verification_type: 'photo',
        status: 'pending',
      }));

      const { error } = await supabase
        .from('verification_requests')
        .insert(insertData);

      if (error) throw error;

      toast({
        title: 'Verification requests sent',
        description: `Requests sent to ${workingEmployees.length} working employees`,
      });

      await fetchData();
    } catch (error) {
      console.error('Error sending requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to send verification requests.',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('verification_requests')
        .update({
          response_status: 'approved',
          reviewer_comment: comment,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Verification Approved',
        description: 'The employee verification has been approved.',
      });
      setSelectedRequest(null);
      setViewDetailRequest(null);
      setComment('');
      await fetchData();
    } catch (error) {
      console.error('Error approving:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve verification.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('verification_requests')
        .update({
          response_status: 'rejected',
          reviewer_comment: comment,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Verification Rejected',
        description: 'The employee verification has been rejected.',
        variant: 'destructive',
      });
      setSelectedRequest(null);
      setViewDetailRequest(null);
      setComment('');
      await fetchData();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject verification.',
        variant: 'destructive',
      });
    }
  };

  const openViewDetail = (request: VerificationRequest) => {
    setViewDetailRequest(request);
    setComment('');
  };

  // Filter requests
  const submittedRequests = requests.filter(r => r.status === 'completed' && !r.response);
  const reviewedRequests = requests.filter(r => r.response);
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const missedCount = requests.filter(r => r.status === 'skipped' || r.status === 'expired').length;



  const renderRequestCard = (request: VerificationRequest, showReviewActions = false) => (
    <Card key={request.id} className="hover:shadow-card transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold">
            {request.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{request.employeeName}</h3>
              <Badge
                variant={
                  request.response?.status === 'approved' ? 'default' :
                    request.response?.status === 'rejected' ? 'destructive' :
                      request.status === 'completed' ? 'secondary' : 'outline'
                }
              >
                {request.response ? request.response.status : request.status}
              </Badge>
            </div>

            {request.mediaUrl && (
              <div className="flex items-center gap-2 mb-3">
                {request.mediaType === 'image' ? (
                  <ImageIcon className="h-4 w-4 text-primary" />
                ) : (
                  <Video className="h-4 w-4 text-primary" />
                )}
                <span className="text-sm text-primary">
                  {request.mediaType === 'image' ? 'Photo' : 'Video'} submitted
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Requested: {request.requestTime}
              </span>
              {request.submittedAt && (
                <span>Submitted: {request.submittedAt}</span>
              )}
            </div>

            {showReviewActions && request.status === 'completed' && !request.response && (
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openViewDetail(request)}
                  className="gap-1"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
                <Button
                  size="sm"
                  onClick={() => setSelectedRequest(request)}
                >
                  Quick Review
                </Button>
              </div>
            )}

            {request.response && (
              <div className="mt-3 p-3 rounded-lg bg-accent">
                <p className="text-sm">
                  <strong>Response:</strong> {request.response.comment || 'No comment'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Responded: {format(request.response.respondedAt, 'MMM d, h:mm a')}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Verification Control</h1>
          <p className="text-muted-foreground">Send verification requests and review employee submissions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
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
                <div className="p-2 rounded-lg bg-primary/10">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{submittedRequests.length}</p>
                  <p className="text-sm text-muted-foreground">Awaiting Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Check className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reviewedRequests.length}</p>
                  <p className="text-sm text-muted-foreground">Reviewed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <X className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{missedCount}</p>
                  <p className="text-sm text-muted-foreground">Missed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Send Request */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Send Verification Request
            </CardTitle>
            <CardDescription>Request presence verification from employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((e) => e.status === 'working')
                    .map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                            {employee.avatar}
                          </div>
                          {employee.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSendRequest} className="gap-2">
                <Send className="h-4 w-4" />
                Send Request
              </Button>
              <Button variant="outline" onClick={handleSendToAll} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Send to All Working
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Verification Requests */}
        <Tabs defaultValue="submitted" className="space-y-4">
          <TabsList>
            <TabsTrigger value="submitted">
              Awaiting Review ({submittedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending Response ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed">
              Reviewed ({reviewedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submitted" className="space-y-4">
            {submittedRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <ClipboardCheck className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No submissions awaiting review</p>
                </CardContent>
              </Card>
            ) : (
              submittedRequests.map(req => renderRequestCard(req, true))
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending verification requests</p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map(req => renderRequestCard(req))
            )}
          </TabsContent>

          <TabsContent value="reviewed" className="space-y-4">
            {reviewedRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Check className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No reviewed verifications yet</p>
                </CardContent>
              </Card>
            ) : (
              reviewedRequests.map(req => renderRequestCard(req))
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Review Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Quick Review</DialogTitle>
              <DialogDescription>
                Review the submitted verification from {selectedRequest?.employeeName}
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4 py-4">
                {selectedRequest.mediaUrl && (
                  <div className="rounded-lg overflow-hidden border border-border">
                    {selectedRequest.mediaType === 'video' ? (
                      <video src={selectedRequest.mediaUrl} controls className="w-full h-48 object-cover" />
                    ) : (
                      <img
                        src={selectedRequest.mediaUrl}
                        alt="Verification submission"
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      Submitted: {selectedRequest.submittedAt}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Add Comment (Optional)</label>
                  <Textarea
                    placeholder="Add a comment for the employee..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1 gap-1"
                    onClick={() => handleApprove(selectedRequest.id)}
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-1"
                    onClick={() => handleReject(selectedRequest.id)}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Detail Dialog */}
        <Dialog open={!!viewDetailRequest} onOpenChange={() => { setViewDetailRequest(null); setIsMediaFullscreen(false); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Verification Details
              </DialogTitle>
              <DialogDescription>
                Review the full verification submission from {viewDetailRequest?.employeeName}
              </DialogDescription>
            </DialogHeader>

            {viewDetailRequest && (
              <div className="space-y-6 py-4">
                {/* Employee Info */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-accent">
                  <div className="h-14 w-14 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-xl">
                    {viewDetailRequest.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{viewDetailRequest.employeeName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Requested: {viewDetailRequest.requestTime}
                    </p>
                  </div>
                </div>

                {/* Submitted Media */}
                {viewDetailRequest.mediaUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        {viewDetailRequest.mediaType === 'video' ? (
                          <><Video className="h-4 w-4" /> Video Submission</>
                        ) : (
                          <><ImageIcon className="h-4 w-4" /> Photo Submission</>
                        )}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMediaFullscreen(!isMediaFullscreen)}
                      >
                        <Maximize2 className="h-4 w-4 mr-1" />
                        {isMediaFullscreen ? 'Minimize' : 'Fullscreen'}
                      </Button>
                    </div>

                    <div className={`rounded-lg overflow-hidden border border-border ${isMediaFullscreen ? 'fixed inset-4 z-50 bg-background' : ''}`}>
                      {viewDetailRequest.mediaType === 'video' ? (
                        <video
                          src={viewDetailRequest.mediaUrl}
                          controls
                          className={`w-full ${isMediaFullscreen ? 'h-full object-contain' : 'max-h-96 object-cover'}`}
                        />
                      ) : (
                        <img
                          src={viewDetailRequest.mediaUrl}
                          alt="Verification submission"
                          className={`w-full ${isMediaFullscreen ? 'h-full object-contain' : 'max-h-96 object-cover'}`}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Comment Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Manager Comment (Optional)</label>
                  <Textarea
                    placeholder="Add feedback or notes for the employee..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    className="flex-1 gap-2"
                    size="lg"
                    onClick={() => handleApprove(viewDetailRequest.id)}
                  >
                    <Check className="h-5 w-5" />
                    Approve Verification
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    size="lg"
                    onClick={() => handleReject(viewDetailRequest.id)}
                  >
                    <X className="h-5 w-5" />
                    Reject Verification
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedLayout>
  );
}
