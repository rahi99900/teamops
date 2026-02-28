'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Clock, Camera, Save, Globe, MapPin, Copy, Hash,
  Briefcase, Users, Check, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function CompanySettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState({
    id: '',
    companyName: '',
    companyCode: '',
    address: '',
    website: '',
    industry: '',
    companySize: '',
    timezone: 'UTC',
    workStartTime: '09:00',
    workEndTime: '18:00',
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
    cameraEnabled: true,
    verificationLimitPerDay: '3',
  });

  const fetchCompanySettings = useCallback(async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('companies')
        .select('*')
        .eq('id', user.companyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          companyName: data.name || '',
          companyCode: data.company_code || '',
          address: data.address || '',
          website: data.website || '',
          industry: data.industry || '',
          companySize: data.company_size || '',
          timezone: data.timezone || 'UTC',
          workStartTime: data.work_start_time?.slice(0, 5) || '09:00',
          workEndTime: data.work_end_time?.slice(0, 5) || '18:00',
          lunchStartTime: data.lunch_start_time?.slice(0, 5) || '12:00',
          lunchEndTime: data.lunch_end_time?.slice(0, 5) || '13:00',
          cameraEnabled: data.camera_enabled ?? true,
          verificationLimitPerDay: String(data.verification_limit_per_day ?? 3),
        });
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
      toast({ title: 'Error', description: 'Failed to load company settings.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user?.companyId, toast]);

  useEffect(() => {
    fetchCompanySettings();
  }, [fetchCompanySettings]);

  const handleSave = async () => {
    if (!settings.id) {
      toast({ title: 'Error', description: 'No company found to update.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('companies')
        .update({
          name: settings.companyName,
          address: settings.address || null,
          website: settings.website || null,
          industry: settings.industry || null,
          company_size: settings.companySize || null,
          timezone: settings.timezone,
          work_start_time: settings.workStartTime,
          work_end_time: settings.workEndTime,
          lunch_start_time: settings.lunchStartTime,
          lunch_end_time: settings.lunchEndTime,
          camera_enabled: settings.cameraEnabled,
          verification_limit_per_day: parseInt(settings.verificationLimitPerDay, 10),
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({ title: 'Settings saved!', description: 'Company settings updated successfully.' });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(settings.companyCode);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Company code copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const set = (field: string, value: any) =>
    setSettings(prev => ({ ...prev, [field]: value }));

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Company Settings</h1>
            <p className="text-muted-foreground">Manage your company configuration</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2 sm:w-auto w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Company Information
            </CardTitle>
            <CardDescription>Basic details visible to members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Company Code — read only, prominent */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Company Code</p>
                  <p className="text-xl font-mono font-bold tracking-widest">
                    {settings.companyCode || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Share this with your employees to join</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyCode} className="gap-2 shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={e => set('companyName', e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select value={settings.industry} onValueChange={v => set('industry', v)}>
                  <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    {['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Construction', 'Hospitality', 'Other'].map(i => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Select value={settings.companySize} onValueChange={v => set('companySize', v)}>
                  <SelectTrigger>
                    <Users className="h-4 w-4 text-muted-foreground mr-2" />
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {['1-10 employees', '11-50 employees', '51-200 employees', '201-500 employees', '500+ employees'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={settings.timezone} onValueChange={v => set('timezone', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Asia/Dhaka">Bangladesh (BST +6)</SelectItem>
                    <SelectItem value="Asia/Kolkata">India (IST +5:30)</SelectItem>
                    <SelectItem value="Asia/Karachi">Pakistan (PKT +5)</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">UK (GMT/BST)</SelectItem>
                    <SelectItem value="Europe/Berlin">Central Europe (CET)</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai (GST +4)</SelectItem>
                    <SelectItem value="Asia/Singapore">Singapore (SGT +8)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Japan (JST +9)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Office Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  value={settings.address}
                  onChange={e => set('address', e.target.value)}
                  placeholder="123 Business St, City, Country"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  value={settings.website}
                  onChange={e => set('website', e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="pl-10"
                  type="url"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Work Hours Policy
            </CardTitle>
            <CardDescription>Configure standard work hours and breaks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workStartTime">Work Start Time</Label>
                <Input
                  id="workStartTime"
                  type="time"
                  value={settings.workStartTime}
                  onChange={e => set('workStartTime', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workEndTime">Work End Time</Label>
                <Input
                  id="workEndTime"
                  type="time"
                  value={settings.workEndTime}
                  onChange={e => set('workEndTime', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lunchStartTime">Lunch Start</Label>
                <Input
                  id="lunchStartTime"
                  type="time"
                  value={settings.lunchStartTime}
                  onChange={e => set('lunchStartTime', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunchEndTime">Lunch End</Label>
                <Input
                  id="lunchEndTime"
                  type="time"
                  value={settings.lunchEndTime}
                  onChange={e => set('lunchEndTime', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Verification Settings
            </CardTitle>
            <CardDescription>Configure attendance verification features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Camera Verification</Label>
                <p className="text-sm text-muted-foreground">Require photo verification for clock-in/out</p>
              </div>
              <Switch
                checked={settings.cameraEnabled}
                onCheckedChange={checked => set('cameraEnabled', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verLimit">Daily Verification Limit</Label>
              <Select
                value={settings.verificationLimitPerDay}
                onValueChange={v => set('verificationLimitPerDay', v)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['1', '2', '3', '5', '10'].map(n => (
                    <SelectItem key={n} value={n}>{n} per day</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Save button */}
        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 px-8">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>

      </div>
    </ProtectedLayout>
  );
}
