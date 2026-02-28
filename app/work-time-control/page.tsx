'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useState, useEffect } from 'react';
import { Clock, Coffee, Play, Square, Users, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useWorkTime, WorkTimeConfig } from '@/contexts/WorkTimeContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EmployeeStatus {
  id: string;
  name: string;
  mode: 'working' | 'break' | 'ended' | 'idle';
  workTime: number;
  breakTime: number;
}

export default function WorkTimeControl() {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    config,
    updateConfig,
    globalMode,
    activeBreakReason,
    startGlobalBreak,
    endGlobalBreak,
    endAllWork,
  } = useWorkTime();

  const [showSettings, setShowSettings] = useState(false);
  const [showBreakDialog, setShowBreakDialog] = useState(false);
  const [breakReason, setBreakReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeStatus[]>([]);
  const [localConfig, setLocalConfig] = useState<WorkTimeConfig>(config);

  // Sync local config when context config changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Fetch real-time employee statuses
  useEffect(() => {
    if (!user?.companyId) return;

    const fetchStatuses = async () => {
      try {
        setLoading(true);
        // Get employees
        const { data: employees } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .eq('company_id', user.companyId);

        // Get today's sessions
        const today = new Date().toISOString().split('T')[0];
        const { data: sessions } = await supabase
          .from('work_sessions')
          .select('*')
          .eq('date', today);

        const statuses: EmployeeStatus[] = (employees || []).map((emp: any) => {
          const session = (sessions || []).find((s: any) => s.user_id === emp.id);
          let mode: 'working' | 'break' | 'ended' | 'idle' = 'idle';
          let workTime = 0;
          let breakTime = 0;

          if (session) {
            if (session.clock_out) {
              mode = 'ended';
            } else if (session.is_on_break) {
              mode = 'break';
            } else {
              mode = 'working';
            }
            workTime = session.total_work_seconds || 0;
            breakTime = session.total_break_seconds || 0;
          }

          return {
            id: emp.id,
            name: `${emp.first_name} ${emp.last_name}`,
            mode,
            workTime,
            breakTime,
          };
        });

        setEmployeeStatuses(statuses);
      } catch (error) {
        console.error('Error fetching statuses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();

    // Subscribe to work_sessions changes for real-time dashboard updates
    const channel = supabase
      .channel('admin-dashboard-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'work_sessions' },
        () => fetchStatuses()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.companyId]);

  const handleSaveSettings = async () => {
    await updateConfig(localConfig);
    setShowSettings(false);
  };

  const handleStartBreakConfirm = async () => {
    if (!breakReason.trim()) {
      toast({ title: 'Reason required', description: 'Please enter a reason for the break', variant: 'destructive' });
      return;
    }
    await startGlobalBreak(breakReason);
    setBreakReason('');
    setShowBreakDialog(false);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'working': return 'bg-success';
      case 'break': return 'bg-warning';
      case 'ended': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'working': return 'Working';
      case 'break': return 'On Break';
      case 'ended': return 'Ended';
      default: return 'Idle';
    }
  };

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
            <h1 className="text-2xl font-bold">Work Time Control</h1>
            <p className="text-muted-foreground">Manage break times and work hours for all employees</p>
          </div>
          <Button variant="outline" onClick={() => setShowSettings(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>

        {/* Global Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Global Work Control
            </CardTitle>
            <CardDescription>Control work/break mode for all employees at once</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={cn('h-4 w-4 rounded-full animate-pulse', getModeColor(globalMode))} />
                  <span className="text-lg font-semibold">
                    Current Mode: {getModeLabel(globalMode)}
                  </span>
                </div>
                {globalMode === 'break' && activeBreakReason && (
                  <p className="text-sm text-warning font-medium ml-7">
                    Reason: {activeBreakReason}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {globalMode !== 'break' && globalMode !== 'ended' && (
                  <Button onClick={() => setShowBreakDialog(true)} variant="outline" className="gap-2 border-warning text-warning hover:bg-warning/10">
                    <Coffee className="h-4 w-4" />
                    Start Global Break
                  </Button>
                )}

                {globalMode === 'break' && (
                  <Button onClick={() => endGlobalBreak()} className="gap-2 bg-success hover:bg-success/90">
                    <Play className="h-4 w-4" />
                    Resume Work
                  </Button>
                )}

                {globalMode !== 'ended' && (
                  <Button onClick={() => endAllWork()} variant="destructive" className="gap-2">
                    <Square className="h-4 w-4" />
                    End Work Day
                  </Button>
                )}

                {globalMode === 'ended' && (
                  <Badge variant="secondary" className="text-base py-2 px-4">
                    Work Day Ended
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Status Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Employee Work Status
            </CardTitle>
            <CardDescription>Real-time status of all employees</CardDescription>
          </CardHeader>
          <CardContent>
            {employeeStatuses.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No employees found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {employeeStatuses.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-4 rounded-lg border border-border bg-card hover:shadow-card transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold">{emp.name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'capitalize',
                          emp.mode === 'working' && 'border-success text-success',
                          emp.mode === 'break' && 'border-warning text-warning',
                          emp.mode === 'ended' && 'border-muted-foreground text-muted-foreground'
                        )}
                      >
                        {emp.mode}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Work: {formatTime(emp.workTime)}</span>
                      <span>Break: {formatTime(emp.breakTime)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Work Time Settings</DialogTitle>
              <DialogDescription>Configure work hours and break times</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workStart">Work Start Time</Label>
                  <Input
                    id="workStart"
                    type="time"
                    value={localConfig.workStartTime}
                    onChange={(e) => setLocalConfig({ ...localConfig, workStartTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workEnd">Work End Time</Label>
                  <Input
                    id="workEnd"
                    type="time"
                    value={localConfig.workEndTime}
                    onChange={(e) => setLocalConfig({ ...localConfig, workEndTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="breakStart">Break Start Time</Label>
                  <Input
                    id="breakStart"
                    type="time"
                    value={localConfig.breakStartTime}
                    onChange={(e) => setLocalConfig({ ...localConfig, breakStartTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breakEnd">Break End Time</Label>
                  <Input
                    id="breakEnd"
                    type="time"
                    value={localConfig.breakEndTime}
                    onChange={(e) => setLocalConfig({ ...localConfig, breakEndTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <Label>Auto Break Alerts</Label>
                  <p className="text-sm text-muted-foreground">Show alerts at break start/end times</p>
                </div>
                <Switch
                  checked={localConfig.autoBreakEnabled}
                  onCheckedChange={(checked) => setLocalConfig({ ...localConfig, autoBreakEnabled: checked })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button onClick={handleSaveSettings}>Save Settings</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manual Break Dialog */}
        <Dialog open={showBreakDialog} onOpenChange={setShowBreakDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Global Break</DialogTitle>
              <DialogDescription>
                This will switch all employees to break mode. Please provide a reason.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="breakReason">Reason for Break</Label>
                <Textarea
                  id="breakReason"
                  placeholder="e.g. Lunch, Team Meeting, Emergency..."
                  value={breakReason}
                  onChange={(e) => setBreakReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBreakDialog(false)}>Cancel</Button>
              <Button onClick={handleStartBreakConfirm} className="bg-warning text-warning-foreground hover:bg-warning/90">
                Start Break
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </ProtectedLayout>
  );
}
