'use client'

import { X, LayoutGrid, Users, ClipboardCheck, Calendar, DollarSign, FileText, Settings, Bell, UserCog, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, allPermissions } from '@/contexts/PermissionsContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

// Unassigned users navigation (limited to 3 pages)
const unassignedNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { href: '/company-apply', label: 'Company Apply', icon: Briefcase },
    { href: '/profile', label: 'My Profile', icon: UserCog },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()
    const { user } = useAuth()
    const { hasPermission } = usePermissions()

    // Don't show sidebar if no user
    // Early return removed to satisfy Rules of Hooks (useMemo below)

    const isActive = (path: string) => {
        return pathname === path || pathname.startsWith(`${path}/`)
    }



    // Build navigation dynamically based on permissions
    const navItems = useMemo(() => {
        if (!user) return []

        // Unassigned or pending users: show limited nav
        if (
            user.role === 'unassigned' ||
            user.companyStatus === 'pending' ||
            user.companyStatus === 'none' ||
            !user.companyId
        ) {
            return unassignedNavItems
        }

        if (user.companyStatus === 'approved' && user.permissions) {
            const items = allPermissions
                .filter(perm => {
                    // CEO gets all pages
                    if (hasPermission(user.permissions, 'all')) return true
                    // Check if user has this specific permission
                    return hasPermission(user.permissions, perm.id)
                })
                .filter(perm => perm.route) // Only include permissions with routes
                .map(perm => {
                    let icon = LayoutGrid // Default icon

                    if (perm.id.includes('dashboard')) icon = LayoutGrid
                    else if (perm.id.includes('team') || perm.id.includes('staff')) icon = Users
                    else if (perm.id.includes('attendance') || perm.id.includes('verification') || perm.id.includes('work')) icon = ClipboardCheck
                    else if (perm.id.includes('leave')) icon = Calendar
                    else if (perm.id.includes('salary')) icon = DollarSign
                    else if (perm.id.includes('report')) icon = FileText
                    else if (perm.id.includes('settings') || perm.id.includes('role') || perm.id.includes('config')) icon = Settings
                    else if (perm.id.includes('announcement')) icon = Bell
                    else if (perm.id.includes('profile')) icon = UserCog

                    return {
                        href: perm.route!,
                        label: perm.label,
                        icon
                    }
                })
                // Remove duplicates based on href
                .filter((item, index, self) =>
                    self.findIndex(i => i.href === item.href) === index
                )

            // Fallback to unassigned items if permissions are empty (e.g. not seeded yet)
            return items.length > 0 ? items : unassignedNavItems
        }

        return unassignedNavItems
    }, [user, hasPermission])

    // Only hide sidebar if there is no user at all
    if (!user) {
        return null
    }

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex h-16 items-center justify-between border-b border-border px-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <LayoutGrid className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-lg">TeamOps</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                        {navItems.map((item) => {
                            const active = isActive(item.href)
                            const Icon = item.icon

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                        active
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    )}
                                    onClick={onClose}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User info */}
                    <div className="border-t border-border p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                                {user.firstName?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">
                                    {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {user.position || user.role}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
