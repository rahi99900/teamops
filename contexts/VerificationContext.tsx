'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type VerificationStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'expired';

export interface VerificationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  managerId: string;
  managerName: string;
  type: 'identity' | 'location' | 'attendance' | 'custom';
  title: string;
  description: string;
  requestedAt: Date;
  deadline?: Date;
  status: VerificationStatus;
  submittedMedia?: {
    type: 'image' | 'video';
    url: string;
    submittedAt: Date;
  };
  response?: {
    status: 'approved' | 'rejected';
    comment?: string;
    respondedAt: Date;
  };
}

interface VerificationContextType {
  requests: VerificationRequest[];
  getRequestsForEmployee: (employeeId: string) => VerificationRequest[];
  getRequestsForManager: (managerId: string) => VerificationRequest[];
  getPendingRequestsForEmployee: (employeeId: string) => VerificationRequest[];
  createRequest: (request: Omit<VerificationRequest, 'id' | 'requestedAt' | 'status'>) => void;
  acceptRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
  submitVerification: (requestId: string, mediaType: 'image' | 'video', mediaUrl: string) => void;
  respondToVerification: (requestId: string, approved: boolean, comment?: string) => void;
}

const demoRequests: VerificationRequest[] = [
  {
    id: 'vr-1',
    employeeId: '4',
    employeeName: 'Alex Johnson',
    employeeEmail: 'alex@techflow.com',
    managerId: '3',
    managerName: 'James Wilson',
    type: 'identity',
    title: 'Daily Identity Check',
    description: 'Please verify your identity by taking a photo or short video.',
    requestedAt: new Date(Date.now() - 1800000),
    deadline: new Date(Date.now() + 3600000),
    status: 'pending',
  },
  {
    id: 'vr-2',
    employeeId: '4',
    employeeName: 'Alex Johnson',
    employeeEmail: 'alex@techflow.com',
    managerId: '3',
    managerName: 'James Wilson',
    type: 'location',
    title: 'Work Location Verification',
    description: 'Please confirm your current work location.',
    requestedAt: new Date(Date.now() - 86400000),
    status: 'completed',
    submittedMedia: {
      type: 'image',
      url: '/placeholder.svg',
      submittedAt: new Date(Date.now() - 82800000),
    },
    response: {
      status: 'approved',
      comment: 'Verified successfully',
      respondedAt: new Date(Date.now() - 79200000),
    },
  },
];

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

export function VerificationProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<VerificationRequest[]>(demoRequests);

  const getRequestsForEmployee = (employeeId: string) => {
    return requests.filter(r => r.employeeId === employeeId);
  };

  const getRequestsForManager = (managerId: string) => {
    return requests.filter(r => r.managerId === managerId);
  };

  const getPendingRequestsForEmployee = (employeeId: string) => {
    return requests.filter(r => r.employeeId === employeeId && r.status === 'pending');
  };

  const createRequest = (request: Omit<VerificationRequest, 'id' | 'requestedAt' | 'status'>) => {
    const newRequest: VerificationRequest = {
      ...request,
      id: `vr-${Date.now()}`,
      requestedAt: new Date(),
      status: 'pending',
    };
    setRequests(prev => [newRequest, ...prev]);
  };

  const acceptRequest = (requestId: string) => {
    setRequests(prev =>
      prev.map(r => r.id === requestId ? { ...r, status: 'accepted' as const } : r)
    );
  };

  const rejectRequest = (requestId: string) => {
    setRequests(prev =>
      prev.map(r => r.id === requestId ? { ...r, status: 'rejected' as const } : r)
    );
  };

  const submitVerification = (requestId: string, mediaType: 'image' | 'video', mediaUrl: string) => {
    setRequests(prev =>
      prev.map(r => r.id === requestId ? {
        ...r,
        status: 'completed' as const,
        submittedMedia: {
          type: mediaType,
          url: mediaUrl,
          submittedAt: new Date(),
        },
      } : r)
    );
  };

  const respondToVerification = (requestId: string, approved: boolean, comment?: string) => {
    setRequests(prev =>
      prev.map(r => r.id === requestId ? {
        ...r,
        response: {
          status: approved ? 'approved' : 'rejected',
          comment,
          respondedAt: new Date(),
        },
      } : r)
    );
  };

  return (
    <VerificationContext.Provider
      value={{
        requests,
        getRequestsForEmployee,
        getRequestsForManager,
        getPendingRequestsForEmployee,
        createRequest,
        acceptRequest,
        rejectRequest,
        submitVerification,
        respondToVerification,
      }}
    >
      {children}
    </VerificationContext.Provider>
  );
}

export function useVerification() {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
}
