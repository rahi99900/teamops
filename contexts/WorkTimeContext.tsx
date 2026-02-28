'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type WorkMode = 'idle' | 'working' | 'break' | 'ended';

export interface WorkTimeConfig {
  workStartTime: string;
  workEndTime: string;
  breakStartTime: string;
  breakEndTime: string;
  autoBreakEnabled: boolean;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  reason: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  workHoursLogged: number;
  respondedBy?: string;
  respondedAt?: Date;
}

export interface EmployeeWorkStatus {
  id: string;
  name: string;
  mode: WorkMode;
  workTime: number;
  breakTime: number;
}

interface WorkTimeContextType {
  config: WorkTimeConfig;
  globalMode: WorkMode;
  activeBreakReason: string | null;
  isBreakAlertActive: boolean;
  isWorkEndAlertActive: boolean;
  leaveRequests: LeaveRequest[];
  employeeStatuses: EmployeeWorkStatus[];
  updateConfig: (config: Partial<WorkTimeConfig>) => Promise<void>;
  setGlobalMode: (mode: WorkMode, reason?: string) => Promise<void>;
  startGlobalBreak: (reason: string) => Promise<void>;
  endGlobalBreak: () => Promise<void>;
  endAllWork: () => Promise<void>;
  submitLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'requestedAt' | 'status'>) => Promise<void>;
  approveLeaveRequest: (requestId: string, responderId: string) => void;
  rejectLeaveRequest: (requestId: string, responderId: string) => void;
  dismissBreakAlert: () => void;
  dismissWorkEndAlert: () => void;
  refreshConfig: () => Promise<void>;
  isLoading: boolean;
}

const defaultConfig: WorkTimeConfig = {
  workStartTime: '09:00',
  workEndTime: '18:00',
  breakStartTime: '12:00',
  breakEndTime: '13:00',
  autoBreakEnabled: true,
};

const WorkTimeContext = createContext<WorkTimeContextType | undefined>(undefined);

export function WorkTimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<WorkTimeConfig>(defaultConfig);
  const [globalMode, setGlobalModeState] = useState<WorkMode>('idle');
  const [activeBreakReason, setActiveBreakReason] = useState<string | null>(null);
  const [isBreakAlertActive, setIsBreakAlertActive] = useState(false);
  const [isWorkEndAlertActive, setIsWorkEndAlertActive] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeWorkStatus[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial config and status
  const fetchConfigAndStatus = useCallback(async () => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', user.companyId)
        .single();

      if (error) throw error;

      if (data) {
        setConfig({
          workStartTime: (data as any).work_start_time || '09:00',
          workEndTime: (data as any).work_end_time || '18:00',
          breakStartTime: (data as any).lunch_start_time || '12:00',
          breakEndTime: (data as any).break_end_time || '13:00',
          autoBreakEnabled: true,
        });
        setGlobalModeState((data as any).current_work_status || 'idle');
        setActiveBreakReason((data as any).active_break_reason || null);
      }
    } catch (error) {
      console.error('Error fetching work time config:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.companyId]);

  // Initial Fetch
  useEffect(() => {
    fetchConfigAndStatus();
  }, [fetchConfigAndStatus]);

  // Realtime Subscription
  useEffect(() => {
    if (!user?.companyId) return;

    const channel = supabase
      .channel('company-work-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'companies',
          filter: `id=eq.${user.companyId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData) {
            // Update Status
            if (newData.current_work_status && newData.current_work_status !== globalMode) {
              setGlobalModeState(newData.current_work_status);

              // Handle Alerts based on status change
              if (newData.current_work_status === 'break') {
                setIsBreakAlertActive(true);
                setActiveBreakReason(newData.active_break_reason);
                toast({
                  title: 'Break Time Started',
                  description: `Break started: ${newData.active_break_reason || 'Scheduled Break'}`,
                });
              } else if (newData.current_work_status === 'working') {
                setIsBreakAlertActive(false);
                setActiveBreakReason(null);
                toast({
                  title: 'Back to Work',
                  description: 'Work has resumed.',
                });
              } else if (newData.current_work_status === 'ended') {
                setIsWorkEndAlertActive(true);
                toast({
                  title: 'Work Day Ended',
                  description: 'The work day has officially ended.',
                });
              }
            }

            // Update Config if changed
            setConfig(prev => ({
              ...prev,
              workStartTime: newData.work_start_time || prev.workStartTime,
              workEndTime: newData.work_end_time || prev.workEndTime,
              breakStartTime: newData.lunch_start_time || prev.breakStartTime,
              breakEndTime: newData.break_end_time || prev.breakEndTime,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.companyId, globalMode, toast]);

  // Local Time Check for Scheduled Alerts (Client-side fallback/primary for time-based)
  useEffect(() => {
    if (!config.autoBreakEnabled) return;

    const checkTime = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Only trigger if we are in 'working' mode globally
      if (globalMode === 'working') {
        if (currentTime === config.breakStartTime) {
          // Just a local reminder for now, or could trigger global if admin?
          // Best to let the admin page trigger the global state change to avoid conflicts
          // Or show local alert for employees to know it's time
          // For now, let's keep it tied to the Global Status driven by Admin
        }

        if (currentTime === config.workEndTime) {
          // Similarly, wait for admin to trigger end
        }
      }
    };

    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [config, globalMode]);


  const updateConfig = async (newConfig: Partial<WorkTimeConfig>) => {
    if (!user?.companyId) return;

    try {
      const updates: any = {};
      if (newConfig.workStartTime) updates.work_start_time = newConfig.workStartTime;
      if (newConfig.workEndTime) updates.work_end_time = newConfig.workEndTime;
      if (newConfig.breakStartTime) updates.lunch_start_time = newConfig.breakStartTime;
      if (newConfig.breakEndTime) updates.break_end_time = newConfig.breakEndTime;

      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', user.companyId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Permission denied: You do not have permission to update company settings.');
      }

      // Optimistic update
      setConfig(prev => ({ ...prev, ...newConfig }));
      toast({ title: 'Settings Updated', description: 'Work time settings saved.' });
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Update Failed',
        description: e.message || 'Failed to update settings',
        variant: 'destructive'
      });
    }
  };

  const setGlobalMode = async (mode: WorkMode, reason?: string) => {
    if (!user?.companyId) return;

    try {
      const updates: any = { current_work_status: mode };
      if (mode === 'break' && reason) {
        updates.active_break_reason = reason;
      } else if (mode === 'working') {
        updates.active_break_reason = null;
      }

      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', user.companyId);

      if (error) throw error;

      // State updates handled by Realtime subscription
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const startGlobalBreak = async (reason: string) => {
    await setGlobalMode('break', reason);
  };

  const endGlobalBreak = async () => {
    await setGlobalMode('working');
  };

  const endAllWork = async () => {
    await setGlobalMode('ended');
  };

  const submitLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'requestedAt' | 'status'>) => {
    // Implement explicit DB table for leave requests later if needed
    // For now mocking local list update, but realistically this should be a DB insert
    const newRequest: LeaveRequest = {
      ...request,
      id: `lr-${Date.now()}`,
      requestedAt: new Date(),
      status: 'pending',
    };
    setLeaveRequests(prev => [newRequest, ...prev]);
    toast({ title: 'Request Sent', description: 'Leave request submitted successfully.' });
  };

  const approveLeaveRequest = (requestId: string, responderId: string) => {
    setLeaveRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r));
  };

  const rejectLeaveRequest = (requestId: string, responderId: string) => {
    setLeaveRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r));
  };

  const dismissBreakAlert = () => setIsBreakAlertActive(false);
  const dismissWorkEndAlert = () => setIsWorkEndAlertActive(false);
  const refreshConfig = fetchConfigAndStatus;

  return (
    <WorkTimeContext.Provider
      value={{
        config,
        globalMode,
        activeBreakReason,
        isBreakAlertActive,
        isWorkEndAlertActive,
        leaveRequests,
        employeeStatuses,
        updateConfig,
        setGlobalMode,
        startGlobalBreak,
        endGlobalBreak,
        endAllWork,
        submitLeaveRequest,
        approveLeaveRequest,
        rejectLeaveRequest,
        dismissBreakAlert,
        dismissWorkEndAlert,
        refreshConfig,
        isLoading
      }}
    >
      {children}
    </WorkTimeContext.Provider>
  );
}

export function useWorkTime() {
  const context = useContext(WorkTimeContext);
  if (context === undefined) {
    throw new Error('useWorkTime must be used within a WorkTimeProvider');
  }
  return context;
}
