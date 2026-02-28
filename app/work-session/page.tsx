'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useState, useEffect } from 'react';
import { Play, Square, Camera, Clock, Coffee, LogOut, AlertTriangle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useWorkTime } from '@/contexts/WorkTimeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

type WorkStatus = 'idle' | 'working' | 'break' | 'ended';

export default function WorkSession() {
  const [status, setStatus] = useState<WorkStatus>('idle');
  const [sessionTime, setSessionTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraAction, setCameraAction] = useState<'start' | 'end' | null>(null);
  const [startPhoto, setStartPhoto] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [isStartBlocked, setIsStartBlocked] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    config,
    globalMode,
    activeBreakReason,
    isBreakAlertActive,
    isWorkEndAlertActive,
    submitLeaveRequest,
    dismissBreakAlert,
    dismissWorkEndAlert,
    isLoading
  } = useWorkTime();

  // Start Time Blocking Check
  useEffect(() => {
    if (isLoading) return;

    const checkStartTime = () => {
      const now = new Date();
      const current = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (current < config.workStartTime) {
        setIsStartBlocked(true);
      } else {
        setIsStartBlocked(false);
      }
    };

    checkStartTime();
    const interval = setInterval(checkStartTime, 60000);
    return () => clearInterval(interval);
  }, [config.workStartTime, isLoading]);

  // Timer for work session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'working') {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Timer for break
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'break') {
      interval = setInterval(() => {
        setBreakTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartWork = () => {
    if (isStartBlocked) {
      toast({
        title: 'Work Start Blocked',
        description: `You cannot start work before ${config.workStartTime}.`,
        variant: 'destructive',
      });
      return;
    }
    setCameraAction('start');
    setShowCamera(true);
  };

  const handleEndWork = () => {
    setCameraAction('end');
    setShowCamera(true);
  };

  const handleCameraCapture = (photoData: string) => {
    if (cameraAction === 'start') {
      setStartPhoto(photoData);
      setStatus('working');
      setSessionTime(0);
      setBreakTime(0);
      toast({
        title: 'Work session started',
        description: 'Your attendance has been recorded with photo verification.',
      });
    } else if (cameraAction === 'end') {
      setStatus('ended');
      toast({
        title: 'Work session ended',
        description: `Total work time: ${formatTime(sessionTime)}`,
      });
    }
    setCameraAction(null);
  };

  const handleTakeBreak = () => {
    setStatus('break');
    toast({
      title: 'Break started',
      description: 'Enjoy your break!',
    });
  };

  const handleResumeWork = () => {
    setStatus('working');
    toast({
      title: 'Back to work',
      description: 'Welcome back!',
    });
  };

  const handleStartNewSession = () => {
    setStatus('idle');
    setSessionTime(0);
    setBreakTime(0);
    setStartPhoto(null);
  };

  const handleLeaveRequest = () => {
    if (!leaveReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for leaving early.',
        variant: 'destructive',
      });
      return;
    }

    submitLeaveRequest({
      employeeId: user?.id || '',
      employeeName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      reason: leaveReason,
      workHoursLogged: sessionTime / 3600,
    });

    toast({
      title: 'Leave Request Submitted',
      description: 'Your manager will review your request.',
    });

    setShowLeaveDialog(false);
    setLeaveReason('');
  };

  // Sync with global break mode from manager
  useEffect(() => {
    if (globalMode === 'break' && status === 'working') {
      setStatus('break');
      toast({
        title: 'Break Time Started',
        description: activeBreakReason ? `Global Break: ${activeBreakReason}` : 'Manager has started a global break.',
      });
    } else if (globalMode === 'working' && status === 'break') {
      if (!activeBreakReason) { // If reason cleared, it means global break ended
        setStatus('working');
        toast({
          title: 'Break Ended',
          description: 'Global break has ended. Work timer resumed.',
        });
      }
    } else if (globalMode === 'ended' && status !== 'ended' && status !== 'idle') {
      setStatus('ended');
      toast({
        title: 'Work Day Ended',
        description: 'Manager has ended work for all employees.',
      });
    }
  }, [globalMode, status, toast, activeBreakReason]);

  const getStatusColor = () => {
    switch (status) {
      case 'working': return 'bg-success';
      case 'break': return 'bg-warning';
      case 'ended': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'working': return 'Working';
      case 'break': return 'On Break';
      case 'ended': return 'Session Ended';
      default: return 'Not Started';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Break Time Alert */}
        {isBreakAlertActive && status === 'working' && (
          <Alert className="border-warning bg-warning/10">
            <Bell className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Break Time!</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                {activeBreakReason
                  ? `Break Started: ${activeBreakReason}`
                  : "It's time for a break. Manager will switch to break mode shortly."}
              </span>
              <Button variant="outline" size="sm" onClick={dismissBreakAlert}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Break End Alert */}
        {isBreakAlertActive && status === 'break' && (
          <Alert className="border-success bg-success/10">
            <Bell className="h-4 w-4 text-success" />
            <AlertTitle className="text-success">Break Ended!</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Break time is over. Click Resume to continue working.</span>
              <Button size="sm" onClick={() => { handleResumeWork(); dismissBreakAlert(); }}>
                Resume Work
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Work End Alert */}
        {isWorkEndAlertActive && status !== 'ended' && status !== 'idle' && (
          <Alert className="border-destructive bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertTitle className="text-destructive">Work Day Ending!</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>It&apos;s time to end your work day. Manager will end all work shortly.</span>
              <Button variant="outline" size="sm" onClick={dismissWorkEndAlert}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Work Session</h1>
          <p className="text-muted-foreground">
            Track your work hours with photo verification
          </p>
        </div>

        {/* Status Card */}
        <Card className="overflow-hidden">
          <div className={cn('h-2', getStatusColor())} />
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <div className={cn('h-3 w-3 rounded-full animate-pulse', getStatusColor())} />
                <span className="text-lg font-semibold">{getStatusText()}</span>
              </div>

              {/* Timer Display */}
              <div className="space-y-2">
                <div className="text-6xl font-bold font-timer tracking-tight">
                  {formatTime(sessionTime)}
                </div>
                {breakTime > 0 && (
                  <div className="flex items-center justify-center gap-2 text-warning">
                    <Coffee className="h-4 w-4" />
                    <span className="text-sm">Break: {formatTime(breakTime)}</span>
                  </div>
                )}
              </div>

              {/* Photo Preview */}
              {startPhoto && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <img
                    src={startPhoto}
                    alt="Clock-in photo"
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-success"
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium">Clocked in at</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                {status === 'idle' && (
                  <Button
                    size="lg"
                    onClick={handleStartWork}
                    className="gap-2"
                    disabled={isStartBlocked}
                  >
                    <Camera className="h-5 w-5" />
                    {isStartBlocked ? `Wait for ${config.workStartTime}` : 'Start Work'}
                  </Button>
                )}

                {status === 'working' && (
                  <>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleTakeBreak}
                      className="gap-2"
                    >
                      <Coffee className="h-5 w-5" />
                      Take Break
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={handleEndWork}
                      className="gap-2"
                    >
                      <Square className="h-5 w-5" />
                      End Work
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => setShowLeaveDialog(true)}
                      className="gap-2"
                    >
                      <LogOut className="h-5 w-5" />
                      Leave for Today
                    </Button>
                  </>
                )}

                {status === 'break' && (
                  <>
                    <Button size="lg" onClick={handleResumeWork} className="gap-2">
                      <Play className="h-5 w-5" />
                      Resume Work
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={handleEndWork}
                      className="gap-2"
                    >
                      <Square className="h-5 w-5" />
                      End Work
                    </Button>
                  </>
                )}

                {status === 'ended' && (
                  <Button size="lg" onClick={handleStartNewSession} className="gap-2">
                    <Play className="h-5 w-5" />
                    Start New Session
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Work Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{formatTime(sessionTime)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Break Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-warning" />
                <span className="text-2xl font-bold">{formatTime(breakTime)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-success" />
                <span className="text-2xl font-bold">
                  {formatTime(Math.max(0, sessionTime - breakTime))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Camera Modal */}
        <CameraCapture
          isOpen={showCamera}
          onClose={() => {
            setShowCamera(false);
            setCameraAction(null);
          }}
          onCapture={handleCameraCapture}
          title={cameraAction === 'start' ? 'Clock In Photo' : 'Clock Out Photo'}
          countdownSeconds={3}
        />

        {/* Leave Request Dialog */}
        <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Early Leave</DialogTitle>
              <DialogDescription>
                Submit a request to your manager to leave early for today.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-accent">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Work logged so far:</span>
                  <span className="font-medium">{formatTime(sessionTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Net hours:</span>
                  <span className="font-medium">{formatTime(Math.max(0, sessionTime - breakTime))}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for leaving early *</label>
                <Textarea
                  placeholder="Please provide a reason for your early leave request..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowLeaveDialog(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleLeaveRequest}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

    </ProtectedLayout>
  );
}
