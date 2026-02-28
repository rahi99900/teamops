'use client'

import Link from 'next/link'
import { LayoutGrid, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LandingHeader() {
    const { user, isAuthenticated, signOut } = useAuth()
    const router = useRouter()

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-lg">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-110">
                        <LayoutGrid className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">TeamOps</span>
                </Link>

                <nav className="hidden md:flex items-center gap-6">
                    <Link href="/features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full">
                        Features
                    </Link>
                    <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full">
                        Pricing
                    </Link>
                    <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full">
                        About
                    </Link>
                </nav>

                <div className="flex items-center gap-3">
                    {isAuthenticated && user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-3 rounded-full p-1 hover:bg-accent transition-colors">
                                    <div className="hidden text-right sm:block">
                                        <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
                                        <p className="text-xs text-muted-foreground">{user.role}</p>
                                    </div>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20">
                                        {user.firstName?.charAt(0) || 'U'}
                                    </div>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard" className="cursor-pointer">Dashboard</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/profile" className="cursor-pointer">Profile</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={async () => {
                                    await signOut()
                                    router.push('/')
                                }} className="text-destructive cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <>
                            <Button variant="outline" asChild className="hidden sm:flex hover:scale-105 transition-transform">
                                <Link href="/login">Login</Link>
                            </Button>
                            <Button asChild className="hover:scale-105 transition-transform shadow-lg hover:shadow-primary/25">
                                <Link href="/signup">Get Started</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
