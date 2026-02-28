'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import EmployeeDashboard from './page'

export default function DashboardPage() {
    return (
        <ProtectedLayout>
            <EmployeeDashboard />
        </ProtectedLayout>
    )
}
