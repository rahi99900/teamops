'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LayoutGrid, Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [sent, setSent] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return

        setIsSending(true)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${window.location.origin}/settings`,
            })

            if (error) throw error

            setSent(true)
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.message || 'Failed to send reset email. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-background">

            {/* Left branding panel */}
            <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-16 py-12 bg-primary/5 border-r border-border">
                <div className="max-w-lg">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <LayoutGrid className="h-6 w-6" />
                        </div>
                        <span className="text-2xl font-bold">TeamOps</span>
                    </div>
                    <h1 className="text-4xl font-black mb-4 leading-tight">
                        Reset your password
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        No worries! Enter your email address and we'll send you a link to reset your password instantly.
                    </p>

                    <div className="mt-10 space-y-4">
                        {[
                            'Secure password reset link',
                            'Link expires in 1 hour',
                            'Check spam folder if not received',
                        ].map(tip => (
                            <div key={tip} className="flex items-center gap-3 text-muted-foreground">
                                <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                                <span>{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8 lg:max-w-lg">
                <div className="w-full max-w-md mx-auto">

                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <LayoutGrid className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold">TeamOps</span>
                    </div>

                    <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">

                        {!sent ? (
                            <>
                                <div className="mb-8">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-6">
                                        <Mail className="h-7 w-7 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-1">Forgot your password?</h2>
                                    <p className="text-muted-foreground text-sm">
                                        Enter your registered email address and we'll send you a reset link.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@company.com"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="pl-10 h-11"
                                                required
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-11 font-semibold gap-2"
                                        disabled={isSending || !email.trim()}
                                    >
                                        {isSending ? (
                                            <><Loader2 className="h-4 w-4 animate-spin" />Sending...</>
                                        ) : (
                                            <>Send Reset Link</>
                                        )}
                                    </Button>
                                </form>

                                <div className="mt-6 text-center">
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to login
                                    </Link>
                                </div>
                            </>
                        ) : (
                            /* Success state */
                            <div className="text-center py-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mx-auto mb-6">
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Check your email!</h2>
                                <p className="text-muted-foreground mb-2">
                                    We sent a password reset link to
                                </p>
                                <p className="font-semibold text-primary mb-6">{email}</p>
                                <p className="text-sm text-muted-foreground mb-8">
                                    Click the link in the email to reset your password. The link will expire in 1 hour.
                                    Don't forget to check your spam folder.
                                </p>
                                <div className="space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full gap-2"
                                        onClick={() => { setSent(false); setEmail('') }}
                                    >
                                        <Mail className="h-4 w-4" />
                                        Try a different email
                                    </Button>
                                    <Link href="/login">
                                        <Button className="w-full gap-2">
                                            <ArrowLeft className="h-4 w-4" />
                                            Back to login
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
