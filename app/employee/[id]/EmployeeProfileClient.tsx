'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export default function EmployeeProfileClient({ id }: { id: string }) {
    const router = useRouter()
    const { user } = useAuth()

    useEffect(() => {
        // Redirect to team page with employee ID as query param
        // This allows managers to view employee details
        if (user) {
            router.push(`/team?employee=${id}`)
        } else {
            router.push('/login')
        }
    }, [user, id, router])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
}
