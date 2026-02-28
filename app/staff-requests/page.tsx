'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Check, X, Clock, Mail, Building2, Briefcase, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';

interface Application {
  id: string;
  user_id: string;
  company_id: string;
  department: string | null;
  position: string | null;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  } | null;
}

export default function StaffRequests() {
  const { user } = useAuth();
  const { roles: allRoles } = usePermissions();
  const { toast } = useToast();

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('employee');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter out unassigned role and CEO role (users shouldn't be directly assigned as CEO)
  const assignableRoles = allRoles.filter(role =>
    role.id !== 'unassigned' && role.id !== 'ceo'
  );
  const fetchApplications = useCallback(async () => {
    if (!user?.companyId) return;

    try {
      const { data, error } = await supabase
        .from('company_applications')
        .select(`
          id,
          user_id,
          company_id,
          department,
          position,
          message,
          status,
          created_at,
          users!company_applications_user_id_fkey (
            id,
            email,
            full_name
          )
        `)
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedApplications: Application[] = (data || []).map((app: any) => ({
        ...app,
        user: app.users
      }));

      setApplications(formattedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.companyId, toast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const pendingApplications = applications.filter(a => a.status === 'pending');
  const approvedApplications = applications.filter(a => a.status === 'approved');
  const rejectedApplications = applications.filter(a => a.status === 'rejected');

  const handleApprove = async () => {
    if (!selectedApplication) return;

    setIsProcessing(true);
    try {
      // Update application status
      const { error: appError } = await supabase
        .from('company_applications')
        .update({ status: 'approved' })
        .eq('id', selectedApplication.id);

      if (appError) throw appError;

      // Update user's company_id and company_status
      const { error: userError } = await supabase
        .from('users')
        .update({
          company_id: user!.companyId,
          company_status: 'approved',
        })
        .eq('id', selectedApplication.user_id);

      if (userError) throw userError;

      // Assign role to user in user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedApplication.user_id,
          role: selectedRole,
        });

      if (roleError) throw roleError;

      toast({
        title: 'Request Approved',
        description: `${selectedApplication.user?.full_name} has been added as ${assignableRoles.find(r => r.id === selectedRole)?.name || selectedRole}.`,
      });

      await fetchApplications();
      setIsApproveDialogOpen(false);
      setSelectedApplication(null);
      setSelectedRole('employee');
    } catch (error: any) {
      console.error('Error approving application:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve application',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (application: Application) => {
    setIsProcessing(true);
    try {
      // Update application status to rejected
      const { error } = await supabase
        .from('company_applications')
        .update({ status: 'rejected' })
        .eq('id', application.id);

      if (error) throw error;

      toast({
        title: 'Request Rejected',
        description: `${application.user?.full_name}'s request has been rejected.`,
        variant: 'destructive',
      });

      await fetchApplications();
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject application',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const ApplicationCard = ({ application, showActions = true }: { application: Application; showActions?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {application.user?.full_name ? getInitials(application.user.full_name) : '?'}
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{application.user?.full_name || 'Unknown User'}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                {application.user?.email || 'No email'}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {application.department && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {application.department}
                  </span>
                )}
                {application.position && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {application.position}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge
              variant={
                application.status === 'pending'
                  ? 'secondary'
                  : application.status === 'approved'
                    ? 'default'
                    : 'destructive'
              }
            >
              {application.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
              {application.status === 'approved' && <Check className="h-3 w-3 mr-1" />}
              {application.status === 'rejected' && <X className="h-3 w-3 mr-1" />}
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(application.created_at)}
            </p>
          </div>
        </div>

        {application.message && (
          <div className="mt-4 p-3 rounded-lg bg-accent/50 border border-border">
            <p className="text-sm text-muted-foreground italic">&quot;{application.message}&quot;</p>
          </div>
        )}

        {showActions && application.status === 'pending' && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Button
              variant="default"
              className="flex-1"
              disabled={isProcessing}
              onClick={() => {
                setSelectedApplication(application);
                setIsApproveDialogOpen(true);
              }}
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
              disabled={isProcessing}
              onClick={() => handleReject(application)}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedLayout>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Staff Requests</h1>
            <p className="text-muted-foreground">Review and manage employee join requests</p>
          </div>
          <Badge variant="outline" className="w-fit">
            <Clock className="h-4 w-4 mr-1" />
            {pendingApplications.length} Pending
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <Check className="h-4 w-4" />
              Approved ({approvedApplications.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <X className="h-4 w-4" />
              Rejected ({rejectedApplications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingApplications.length > 0 ? (
              <div className="grid gap-4">
                {pendingApplications.map((application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-full bg-muted mb-4">
                      <UserPlus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">No Pending Requests</h3>
                    <p className="text-muted-foreground max-w-sm">
                      When employees apply to join your company, their requests will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            {approvedApplications.length > 0 ? (
              <div className="grid gap-4">
                {approvedApplications.map((application) => (
                  <ApplicationCard key={application.id} application={application} showActions={false} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No approved requests yet.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            {rejectedApplications.length > 0 ? (
              <div className="grid gap-4">
                {rejectedApplications.map((application) => (
                  <ApplicationCard key={application.id} application={application} showActions={false} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No rejected requests.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Approve Dialog */}
        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Request</DialogTitle>
              <DialogDescription>
                Assign a role to {selectedApplication?.user?.full_name} to approve their join request.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-accent">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {selectedApplication?.user?.full_name ? getInitials(selectedApplication.user.full_name) : '?'}
                  </div>
                  <div>
                    <p className="font-medium">{selectedApplication?.user?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedApplication?.user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex flex-col">
                          <span>{role.name}</span>
                          <span className="text-xs text-muted-foreground">{role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The user will have access to pages based on the selected role&apos;s permissions.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={!selectedRole || isProcessing}>
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Approve & Assign Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

    </ProtectedLayout>
  );
}
