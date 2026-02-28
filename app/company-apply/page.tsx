'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useState, useEffect } from 'react';
import {
  Building2, Send, Search, CheckCircle, Clock, XCircle, Loader2, LogOut, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  name: string;
  company_code: string;
  timezone: string;
}

interface Application {
  id: string;
  company_id: string;
  status: 'pending' | 'approved' | 'rejected';
  company?: Company;
}

export default function CompanyApply() {
  const { user, refreshUserData } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [existingApplication, setExistingApplication] = useState<Application | null>(null);
  const [formData, setFormData] = useState({
    department: '',
    position: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Leave Company state
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);

  // Fetch user's existing application
  useEffect(() => {
    const fetchExistingApplication = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('company_applications')
          .select(`
            id,
            company_id,
            status,
            companies (
              id,
              name,
              company_code,
              timezone
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const appData = data as any;
          const application: Application = {
            id: appData.id,
            company_id: appData.company_id,
            status: appData.status as 'pending' | 'approved' | 'rejected',
            company: appData.companies as Company
          };
          setExistingApplication(application);
        }
      } catch (error) {
        console.error('Error fetching application:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingApplication();
  }, [user]);

  // Search companies
  useEffect(() => {
    const searchCompanies = async () => {
      if (!searchQuery.trim()) {
        setCompanies([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id, name, company_code, timezone')
          .or(`name.ilike.%${searchQuery}%,company_code.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) throw error;
        setCompanies(data || []);
      } catch (error) {
        console.error('Error searching companies:', error);
      }
    };

    const debounce = setTimeout(searchCompanies, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !user) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await (supabase.rpc as any)('apply_to_company', {
        p_company_code: selectedCompany.company_code,
        p_department: formData.department || null,
        p_position: formData.position || null,
        p_message: formData.message || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        toast({
          title: 'Application Failed',
          description: result.error || 'Could not submit application',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Application Submitted!',
        description: `Your request to join ${selectedCompany.name} has been sent.`,
      });

      setExistingApplication({
        id: 'new',
        company_id: selectedCompany.id,
        status: 'pending',
        company: selectedCompany,
      });

      setSelectedCompany(null);
      setFormData({ department: '', position: '', message: '' });
      setSearchQuery('');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Leave Company handler ─────────────────────────────────────────────
  const handleLeaveCompany = async () => {
    if (!user?.id) return;

    setIsLeaving(true);
    try {
      // 1. Remove company_id and set is_active = false on users table
      const { error: userError } = await supabase
        .from('users')
        .update({ company_id: null, is_active: false })
        .eq('id', user.id);

      if (userError) throw userError;

      // 2. Set role back to 'unassigned'
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'unassigned' as any })
        .eq('user_id', user.id);

      if (roleError) throw roleError;

      // 3. Mark any pending/approved applications as rejected
      await supabase
        .from('company_applications')
        .update({ status: 'rejected' })
        .eq('user_id', user.id)
        .in('status', ['pending', 'approved']);

      toast({
        title: 'Left Company',
        description: 'You have successfully left the company.',
      });

      setShowLeaveDialog(false);
      setLeaveReason('');

      // Refresh auth context so sidebar/nav updates
      await refreshUserData();

    } catch (error: any) {
      console.error('Error leaving company:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to leave company',
        variant: 'destructive',
      });
    } finally {
      setIsLeaving(false);
    }
  };

  const handleApplyAgain = () => {
    setExistingApplication(null);
  };

  // ── Render content based on state ────────────────────────────────────
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    // If user is already approved / has a company
    if (user?.companyStatus === 'approved' || user?.companyId) {
      return (
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Joined Banner */}
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 rounded-full bg-green-500/20 mb-4">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-1">You're a member of</h2>
                <h3 className="text-3xl font-extrabold text-primary mb-3">{user?.companyName}</h3>
                <p className="text-muted-foreground max-w-md text-sm">
                  You are currently an active member. Access your dashboard to track work, attendance, and more.
                </p>

                {/* Leave Company button */}
                <Button
                  variant="outline"
                  className="mt-6 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
                  onClick={() => setShowLeaveDialog(true)}
                >
                  <LogOut className="h-4 w-4" />
                  Leave Company
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Show pending application status
    if (existingApplication?.status === 'pending') {
      return (
        <div className="max-w-2xl mx-auto">
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 rounded-full bg-yellow-500/20 mb-4">
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Application Pending</h2>
                <p className="text-muted-foreground max-w-md">
                  Your application to join <strong>{existingApplication.company?.name}</strong> is being reviewed.
                  You will be notified once the company admin approves your request.
                </p>
                <div className="mt-6 p-4 rounded-lg bg-card border border-border">
                  <p className="text-sm text-muted-foreground">
                    Applied to: <span className="font-medium text-foreground">{existingApplication.company?.name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Company Code: {existingApplication.company?.company_code}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Show rejected status
    if (existingApplication?.status === 'rejected') {
      return (
        <div className="max-w-2xl mx-auto">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 rounded-full bg-destructive/20 mb-4">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Application Rejected</h2>
                <p className="text-muted-foreground max-w-md">
                  Unfortunately, your application to join <strong>{existingApplication.company?.name}</strong> was not approved.
                  You can try applying to another company.
                </p>
                <Button className="mt-6" onClick={handleApplyAgain}>
                  Apply to Another Company
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Main application form
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Join a Company</h1>
          <p className="text-muted-foreground">Search for your company using its code or name</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Your Company
              </CardTitle>
              <CardDescription>Search by company name or company code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter company name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    onClick={() => setSelectedCompany(company)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedCompany?.id === company.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{company.name}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Code: <span className="font-mono font-medium">{company.company_code}</span></span>
                        </div>
                      </div>
                      {selectedCompany?.id === company.id && (
                        <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </div>
                  </div>
                ))}

                {searchQuery && companies.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No companies found. Check the company code with your employer.
                  </div>
                )}

                {!searchQuery && (
                  <div className="text-center py-8 text-muted-foreground">
                    Start typing to search for companies
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Application Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Application Details
              </CardTitle>
              <CardDescription>
                {selectedCompany ? `Apply to join ${selectedCompany.name}` : 'Select a company to continue'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCompany ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                    <p className="text-sm font-medium">Applying to: {selectedCompany.name}</p>
                    <p className="text-xs text-muted-foreground">Code: {selectedCompany.company_code}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      placeholder="e.g., Engineering, Marketing"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      placeholder="e.g., Software Engineer"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Introduce yourself or add a note for the hiring manager..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" />Submit Application</>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a company from the list to start your application
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <ProtectedLayout>
      {renderContent()}

      {/* ── Leave Company Dialog ───────────────────────────────────────── */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Leave {user?.companyName}?
            </DialogTitle>
            <DialogDescription>
              This action will remove you from <strong>{user?.companyName}</strong>.
              Your role and company access will be revoked immediately. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="leave-reason">Reason for leaving</Label>
            <Textarea
              id="leave-reason"
              placeholder="Tell us why you're leaving (optional)..."
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => { setShowLeaveDialog(false); setLeaveReason(''); }}
              disabled={isLeaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveCompany}
              disabled={isLeaving}
              className="gap-2"
            >
              {isLeaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Leaving...</>
              ) : (
                <><LogOut className="h-4 w-4" />Leave Company</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </ProtectedLayout>
  );
}
