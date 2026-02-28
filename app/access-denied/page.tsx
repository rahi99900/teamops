'use client'

import { ShieldAlert, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export default function AccessDenied() {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full text-center space-y-8">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full" />
                        <div className="relative bg-destructive/10 p-6 rounded-full">
                            <ShieldAlert className="h-20 w-20 text-destructive" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
                    <p className="text-muted-foreground text-lg">
                        You don&apos;t have permission to access this page.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        This page requires specific permissions that haven&apos;t been granted to your role.
                        {user?.companyName && (
                            <> Please contact your administrator at <span className="font-semibold">{user.companyName}</span> if you believe this is an error.</>
                        )}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">
                            <Home className="h-4 w-4 mr-2" />
                            Go to Dashboard
                        </Link>
                    </Button>
                    <Button onClick={() => window.history.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                </div>

                {/* Additional Info */}
                <div className="pt-6 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                        Your current role: <span className="font-semibold capitalize">{user?.role || 'Unknown'}</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
