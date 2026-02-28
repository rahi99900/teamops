'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type NotificationType = 'company_update' | 'verification_request' | 'salary_published' | 'join_approved' | 'join_rejected' | 'announcement' | 'break_alert' | 'leave_request' | 'general';

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
  targetRoles: string[]; // empty means all
}

interface NotificationContextType {
  notifications: Notification[];
  announcements: Announcement[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  sendAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => void;
}

const demoNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'company_update',
    title: 'New Company Policy',
    message: 'Updated work-from-home policy effective from next week.',
    createdAt: new Date(Date.now() - 3600000),
    read: false,
  },
  {
    id: 'n2',
    type: 'verification_request',
    title: 'Verification Required',
    message: 'Your manager has requested identity verification.',
    createdAt: new Date(Date.now() - 7200000),
    read: false,
    actionUrl: '/employee-verification',
  },
  {
    id: 'n3',
    type: 'salary_published',
    title: 'Salary Published',
    message: 'Your December 2024 salary slip is now available.',
    createdAt: new Date(Date.now() - 86400000),
    read: false,
    actionUrl: '/salary',
  },
  {
    id: 'n4',
    type: 'announcement',
    title: 'Holiday Schedule',
    message: 'Office will be closed from Dec 25 - Jan 1.',
    createdAt: new Date(Date.now() - 172800000),
    read: true,
  },
];

const demoAnnouncements: Announcement[] = [
  {
    id: 'a1',
    title: 'Holiday Schedule',
    message: 'Office will be closed from Dec 25 - Jan 1. Enjoy your holidays!',
    createdAt: new Date(Date.now() - 172800000),
    createdBy: 'ceo-1',
    createdByName: 'John CEO',
    targetRoles: [],
  },
  {
    id: 'a2',
    title: 'Team Meeting',
    message: 'All managers are required to attend the quarterly review meeting on Friday.',
    createdAt: new Date(Date.now() - 86400000),
    createdBy: 'ceo-1',
    createdByName: 'John CEO',
    targetRoles: ['manager', 'admin'],
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(demoNotifications);
  const [announcements, setAnnouncements] = useState<Announcement[]>(demoAnnouncements);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `n-${Date.now()}`,
      createdAt: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const sendAnnouncement = (announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: `a-${Date.now()}`,
      createdAt: new Date(),
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);

    // Also add to notifications for all users
    addNotification({
      type: 'announcement',
      title: announcement.title,
      message: announcement.message,
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        announcements,
        unreadCount,
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

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
