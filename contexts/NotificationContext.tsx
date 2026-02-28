'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'company_join'
  | 'company_leave'
  | 'application_rejected'
  | 'staff_request'
  | 'role_assigned'
  | 'announcement'
  | 'verification'
  | 'leave_request'
  | 'salary_published'
  // legacy support for old types
  | 'company_update'
  | 'verification_request'
  | 'join_approved'
  | 'join_rejected'
  | 'break_alert'
  | 'general';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  targetRoles: string[];
}

interface NotificationContextType {
  notifications: Notification[];
  announcements: Announcement[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  sendAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ── Map DB row to Notification ──────────────────────────────────────────────
function mapDbNotification(row: any): Notification {
  return {
    id: row.id,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    createdAt: new Date(row.created_at),
    read: row.is_read ?? false,
    metadata: row.metadata ?? {},
  };
}

// ── Provider ────────────────────────────────────────────────────────────────
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Fetch initial notifications from DB ─────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data ?? []).map(mapDbNotification));
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // ── Subscribe to new notifications via Supabase Realtime ────────────────
  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newNotif = mapDbNotification(payload.new);
          setNotifications(prev => [newNotif, ...prev]);
        }
      )
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          setNotifications(prev =>
            prev.map(n => n.id === payload.new.id ? mapDbNotification(payload.new) : n)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  // ── Mark one as read (persist to DB) ────────────────────────────────────
  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user?.id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // ── Mark all as read (persist to DB) ────────────────────────────────────
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // ── Add notification locally (for optimistic UI or non-DB flows) ─────────
  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: Notification = {
      ...notification,
      id: `local-${Date.now()}`,
      createdAt: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // ── Dismiss/clear a notification locally ────────────────────────────────
  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => setNotifications([]);

  // ── Send announcement → insert notifications for all company members ────
  const sendAnnouncement = async (announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
    if (!user?.companyId) return;

    const newAnnouncement: Announcement = {
      ...announcement,
      id: `a-${Date.now()}`,
      createdAt: new Date(),
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);

    try {
      // Use the DB helper function to notify all company members
      await (supabase as any).rpc('notify_company_members', {
        p_company_id: user.companyId,
        p_type: 'announcement',
        p_title: announcement.title,
        p_message: announcement.message,
        p_actor_id: user.id,
        p_exclude_user_id: null,
        p_metadata: { createdByName: announcement.createdByName },
      });
    } catch (err) {
      console.error('Error sending announcement:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        announcements,
        unreadCount,
        isLoading,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
        sendAnnouncement,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
