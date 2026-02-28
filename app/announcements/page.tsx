'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Send, Users, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface Announcement {
  id: string;
  title: string;
  message: string;
  target_role: 'all' | 'manager' | 'employee' | 'admin' | null;
  created_by: string;
  created_at: string;
  creator_name?: string;
}

export default function Announcements() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const availableRoles = [
    { id: 'employee', name: 'Employees' },
    { id: 'manager', name: 'Managers' },
    { id: 'admin', name: 'Admins' },
  ];

  const fetchAnnouncements = useCallback(async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get creator names
      const creatorIds = [...new Set((data || []).map(a => a.created_by))];
      const creatorMap: Record<string, string> = {};

      if (creatorIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', creatorIds);

        (users || []).forEach((u: any) => {
          creatorMap[u.id] = u.full_name || 'Unknown';
        });
      }

      const formattedAnnouncements = (data || []).map((a: any) => ({
        ...a,
        creator_name: creatorMap[a.created_by] || 'Unknown',
      }));

      setAnnouncements(formattedAnnouncements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(r => r !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSendAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title and message.',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.companyId || !user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in with a company.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // If sendToAll, use 'all'; otherwise use the first selected role (or 'all' if none)
      const targetRole = sendToAll ? 'all' : (selectedRoles[0] || 'all');

      const { error } = await supabase
        .from('announcements')
        .insert({
          company_id: user.companyId,
          title,
          message,
          target_role: targetRole as 'all' | 'manager' | 'employee' | 'admin',
          created_by: user.id,
        } as any);

      if (error) throw error;

      toast({
        title: 'Announcement Sent',
        description: sendToAll
          ? 'Your announcement has been sent to all employees.'
          : `Your announcement has been sent to ${selectedRoles.length} role(s).`,
      });

      setTitle('');
      setMessage('');
      setSelectedRoles([]);
      setSendToAll(true);

      fetchAnnouncements();
    } catch (error) {
      console.error('Error sending announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to send announcement. Table may not exist yet.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <ProtectedLayout>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Company Announcements</h1>
          <p className="text-muted-foreground">Send announcements to all or specific roles</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Announcement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                New Announcement
              </CardTitle>
              <CardDescription>Create and send a company-wide announcement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Announcement title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Write your announcement message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <Label>Send To</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sendToAll"
                    checked={sendToAll}
                    onCheckedChange={(checked) => setSendToAll(checked === true)}
                  />
                  <label htmlFor="sendToAll" className="text-sm font-medium cursor-pointer">
                    Send to all employees
                  </label>
                </div>

                {!sendToAll && (
                  <div className="pl-6 space-y-2">
                    {availableRoles.map((role) => (
                      <div key={role.id} className="flex items-center gap-2">
                        <Checkbox
                          id={role.id}
                          checked={selectedRoles.includes(role.id)}
                          onCheckedChange={() => handleRoleToggle(role.id)}
                        />
                        <label htmlFor={role.id} className="text-sm cursor-pointer">
                          {role.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={handleSendAnnouncement} disabled={sending} className="w-full gap-2">
                <Send className="h-4 w-4" />
                {sending ? 'Sending...' : 'Send Announcement'}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Announcements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Announcements</CardTitle>
              <CardDescription>Previously sent announcements</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No announcements yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{announcement.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(announcement.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{announcement.message}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {!announcement.target_role || announcement.target_role === 'all' ? (
                          <span>All employees</span>
                        ) : (
                          <span className="capitalize">{announcement.target_role}s</span>
                        )}
                        <span className="flex items-center gap-1 ml-auto">
                          <Check className="h-3 w-3 text-success" />
                          Sent by {announcement.creator_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </ProtectedLayout>
  );
}
