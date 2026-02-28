'use client'

import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { PermissionsProvider } from '@/contexts/PermissionsContext'
import { SalaryProvider } from '@/contexts/SalaryContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { VerificationProvider } from '@/contexts/VerificationContext'
import { WorkTimeProvider } from '@/contexts/WorkTimeContext'

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <PermissionsProvider>
                    <SalaryProvider>
                        <NotificationProvider>
                            <VerificationProvider>
                                <WorkTimeProvider>
                                    <TooltipProvider>
                                        {children}
                                        <Toaster />
                                        <Sonner />
                                    </TooltipProvider>
                                </WorkTimeProvider>
                            </VerificationProvider>
                        </NotificationProvider>
                    </SalaryProvider>
                </PermissionsProvider>
            </AuthProvider>
        </QueryClientProvider>
    )
}
