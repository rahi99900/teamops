'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Phone, Lock, Eye, EyeOff, Shield, KeyRound, Loader2, CheckCircle,
    Save, RefreshCw, ChevronRight, LogOut, Mail
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Section = 'phone' | 'change-password' | 'set-password' | 'forgot-password' | null

export default function SettingsPage() {
    const { user, signOut } = useAuth()
    const { toast } = useToast()
    const router = useRouter()

    const [activeSection, setActiveSection] = useState<Section>(null)
    const [isGoogleUser, setIsGoogleUser] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSigningOut, setIsSigningOut] = useState(false)

    // Phone
    const [phone, setPhone] = useState('')
    const [isSavingPhone, setIsSavingPhone] = useState(false)

    // Change Password
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [isChangingPw, setIsChangingPw] = useState(false)

    // Set Password (Google users)
    const [setPw, setSetPw] = useState('')
    const [setConfirmPw, setSetConfirmPw] = useState('')
    const [showSetPw, setShowSetPw] = useState(false)
    const [showSetConfirmPw, setShowSetConfirmPw] = useState(false)
    const [isSettingPw, setIsSettingPw] = useState(false)

    // Forgot Password
    const [isSendingReset, setIsSendingReset] = useState(false)
    const [resetSent, setResetSent] = useState(false)

    useEffect(() => {
        const loadUser = async () => {
            const { data: { user: su } } = await supabase.auth.getUser()
            if (su) {
                const hasEmail = su.identities?.some(i => i.provider === 'email')
                setIsGoogleUser(!hasEmail)
                setPhone(su.user_metadata?.phone || '')
            }
            setIsLoading(false)
        }
        loadUser()
    }, [])

    const toggle = (section: Section) =>
        setActiveSection(prev => prev === section ? null : section)

    const handleSavePhone = async () => {
        setIsSavingPhone(true)
        try {
            const { error } = await supabase.auth.updateUser({ data: { phone } })
            if (error) throw error
            toast({ title: 'Phone Updated', description: 'Your phone number has been saved.' })
            setActiveSection(null)
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' })
        } finally { setIsSavingPhone(false) }
    }

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) return toast({ title: 'Fill all fields', variant: 'destructive' })
        if (newPassword !== confirmPassword) return toast({ title: 'Passwords do not match', variant: 'destructive' })
        if (newPassword.length < 6) return toast({ title: 'Min 6 characters', variant: 'destructive' })

        setIsChangingPw(true)
        try {
            const { error: signInErr } = await supabase.auth.signInWithPassword({
                email: user?.email || '', password: currentPassword
            })
            if (signInErr) throw new Error('Current password is incorrect.')
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) throw error
            toast({ title: 'Password Changed!', description: 'Your password has been updated.' })
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
            setActiveSection(null)
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' })
        } finally { setIsChangingPw(false) }
    }

    const handleSetPassword = async () => {
        if (!setPw || !setConfirmPw) return toast({ title: 'Fill all fields', variant: 'destructive' })
        if (setPw !== setConfirmPw) return toast({ title: 'Passwords do not match', variant: 'destructive' })
        if (setPw.length < 6) return toast({ title: 'Min 6 characters', variant: 'destructive' })

        setIsSettingPw(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: setPw })
            if (error) throw error
            toast({ title: 'Password Set!', description: 'You can now log in with email and password.' })
            setSetPw(''); setSetConfirmPw('')
            setIsGoogleUser(false)
            setActiveSection(null)
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' })
        } finally { setIsSettingPw(false) }
    }

    const handleForgotPassword = async () => {
        if (!user?.email) return
        setIsSendingReset(true)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/settings`,
            })
            if (error) throw error
            setResetSent(true)
            toast({ title: 'Reset Email Sent!', description: `Check your inbox at ${user.email}` })
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' })
        } finally { setIsSendingReset(false) }
    }

    const handleLogout = async () => {
        setIsSigningOut(true)
        await signOut()
        router.push('/login')
    }

    // Shared password field renderer
    const PwField = ({
        id, label, value, onChange, show, onToggle, placeholder
    }: {
        id: string; label: string; value: string;
        onChange: (v: string) => void; show: boolean;
        onToggle: () => void; placeholder?: string
    }) => (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
                <Input
                    id={id}
                    type={show ? 'text' : 'password'}
                    placeholder={placeholder || 'Min. 6 characters'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="h-11 pr-10"
                />
                <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={onToggle}
                >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </div>
    )

    // Option row component
    const OptionRow = ({
        section, icon: Icon, title, subtitle, danger
    }: {
        section: Section; icon: any; title: string; subtitle: string; danger?: boolean
    }) => (
        <button
            onClick={() => toggle(section)}
            className={cn(
                'w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-accent/50 transition-colors border-b border-border last:border-0',
                activeSection === section && 'bg-accent/50'
            )}
        >
            <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full shrink-0',
                danger ? 'bg-destructive/10' : 'bg-primary/10'
            )}>
                <Icon className={cn('h-4 w-4', danger ? 'text-destructive' : 'text-primary')} />
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn('font-medium text-sm', danger && 'text-destructive')}>{title}</p>
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            </div>
            <ChevronRight className={cn(
                'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200',
                activeSection === section && 'rotate-90'
            )} />
        </button>
    )

    if (isLoading) {
        return (
            <ProtectedLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </ProtectedLayout>
        )
    }

    return (
        <ProtectedLayout>
            <div className="max-w-xl mx-auto space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Account Settings</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage your security and contact info</p>
                </div>

                {/* Options list */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">

                    {/* Phone */}
                    <OptionRow
                        section="phone"
                        icon={Phone}
                        title="Phone Number"
                        subtitle={phone ? `Current: ${phone}` : 'Add your phone number'}
                    />
                    {activeSection === 'phone' && (
                        <div className="px-5 py-4 bg-accent/20 border-b border-border space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+1 (555) 000-0000"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="h-11"
                                />
                            </div>
                            <Button onClick={handleSavePhone} disabled={isSavingPhone} size="sm" className="gap-2">
                                {isSavingPhone ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                Save Phone Number
                            </Button>
                        </div>
                    )}

                    {/* Set Password (Google users only) */}
                    {isGoogleUser && (
                        <>
                            <OptionRow
                                section="set-password"
                                icon={KeyRound}
                                title="Set Email Password"
                                subtitle="You signed in with Google — set a password to also use email login"
                            />
                            {activeSection === 'set-password' && (
                                <div className="px-5 py-4 bg-accent/20 border-b border-border space-y-4">
                                    <PwField id="set-pw" label="New Password" value={setPw} onChange={setSetPw} show={showSetPw} onToggle={() => setShowSetPw(v => !v)} />
                                    <PwField id="set-pw-confirm" label="Confirm Password" placeholder="Repeat password" value={setConfirmPw} onChange={setSetConfirmPw} show={showSetConfirmPw} onToggle={() => setShowSetConfirmPw(v => !v)} />
                                    <Button onClick={handleSetPassword} disabled={isSettingPw} size="sm" className="gap-2">
                                        {isSettingPw ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                                        Set Password
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Change Password (email users only) */}
                    {!isGoogleUser && (
                        <>
                            <OptionRow
                                section="change-password"
                                icon={Lock}
                                title="Change Password"
                                subtitle="Update your current account password"
                            />
                            {activeSection === 'change-password' && (
                                <div className="px-5 py-4 bg-accent/20 border-b border-border space-y-4">
                                    <PwField id="current-pw" label="Current Password" placeholder="Enter current password" value={currentPassword} onChange={setCurrentPassword} show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />
                                    <PwField id="new-pw" label="New Password" value={newPassword} onChange={setNewPassword} show={showNew} onToggle={() => setShowNew(v => !v)} />
                                    <PwField id="confirm-pw" label="Confirm New Password" placeholder="Repeat new password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
                                    <Button onClick={handleChangePassword} disabled={isChangingPw} size="sm" className="gap-2">
                                        {isChangingPw ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                                        Change Password
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Forgot Password */}
                    <OptionRow
                        section="forgot-password"
                        icon={RefreshCw}
                        title="Forgot Password"
                        subtitle={`Send a reset link to ${user?.email}`}
                    />
                    {activeSection === 'forgot-password' && (
                        <div className="px-5 py-4 bg-accent/20 border-b border-border">
                            {resetSent ? (
                                <div className="flex items-center gap-3 text-sm text-green-600 font-medium">
                                    <CheckCircle className="h-5 w-5 shrink-0" />
                                    Reset email sent! Check your inbox at {user?.email}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        We'll send a password reset link to <strong>{user?.email}</strong>
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleForgotPassword}
                                        disabled={isSendingReset}
                                        className="gap-2"
                                    >
                                        {isSendingReset ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                                        Send Reset Email
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Or go to the <Link href="/forgot-password" className="text-primary underline underline-offset-2">full forgot password page</Link>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Logout */}
                <div className="rounded-2xl border border-destructive/20 bg-card overflow-hidden shadow-sm">
                    <button
                        onClick={handleLogout}
                        disabled={isSigningOut}
                        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-destructive/5 transition-colors"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 shrink-0">
                            {isSigningOut
                                ? <Loader2 className="h-4 w-4 text-destructive animate-spin" />
                                : <LogOut className="h-4 w-4 text-destructive" />
                            }
                        </div>
                        <div>
                            <p className="font-medium text-sm text-destructive">
                                {isSigningOut ? 'Signing out...' : 'Sign Out'}
                            </p>
                            <p className="text-xs text-muted-foreground">Log out of your account</p>
                        </div>
                    </button>
                </div>

            </div>
        </ProtectedLayout>
    )
}
