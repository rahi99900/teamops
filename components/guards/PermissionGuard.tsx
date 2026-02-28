'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/contexts/PermissionsContext'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface PermissionGuardProps {
    children: ReactNode
    permission: string | string[]
    requireAll?: boolean
}

export function PermissionGuard({ children, permission, requireAll = false }: PermissionGuardProps) {
    const { user, loading: authLoading } = useAuth()
    const { hasPermission } = usePermissions()
    const router = useRouter()
    const [hasAccess, setHasAccess] = useState<boolean | null>(null)

    useEffect(() => {
        if (authLoading) return

        // No user - redirect to login
        if (!user) {
            router.push('/login')
            return
        }

        // Check permissions
        const permissions = Array.isArray(permission) ? permission : [permission]
        const userPermissions = user.permissions || []

        let access = false
        if (requireAll) {
            access = permissions.every(perm => hasPermission(userPermissions, perm))
        } else {
            access = permissions.some(perm => hasPermission(userPermissions, perm))
        }

        if (!access) {
            router.push('/access-denied')
        }

        setHasAccess(access)
    }, [user, authLoading, permission, requireAll, hasPermission, router])

    // Show loading while checking
    if (authLoading || hasAccess === null) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Don't render if no access or no user
    if (!hasAccess || !user) {
        return null
    }

    return <>{children}</>
}
