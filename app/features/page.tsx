'use client'

import { Check, Clock, Camera, Calendar, BarChart3, Shield, Users, Zap, Bell, Globe, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/layout/Footer'
import { LandingHeader } from '@/components/layout/LandingHeader'
import Link from 'next/link'

export default function FeaturesPage() {
    const features = [
        {
            icon: Clock,
            title: 'Real-time Attendance Tracking',
            description: 'Monitor employee attendance as it happens with live updates and instant notifications.',
            benefits: ['Live dashboard', 'Instant alerts', 'Clock in/out tracking', 'Break management'],
        },
        {
            icon: Camera,
            title: 'Photo Verification',
            description: 'Prevent buddy punching with secure selfie verification using AI-powered face matching.',
            benefits: ['AI face recognition', 'Prevent fraud', 'Secure verification', 'Photo history'],
        },
        {
            icon: Calendar,
            title: 'Smart Scheduling',
            description: 'Automate shift planning with AI-driven suggestions and conflict resolution.',
            benefits: ['Auto-scheduling', 'Conflict detection', 'Shift swapping', 'Calendar sync'],
        },
        {
            icon: BarChart3,
            title: 'Advanced Analytics',
            description: 'Make data-driven decisions with detailed reports on overtime, productivity, and costs.',
            benefits: ['Custom reports', 'Overtime tracking', 'Cost analysis', 'Export data'],
        },
        {
            icon: Shield,
            title: 'Enterprise Security',
            description: 'Bank-level encryption and security to protect your sensitive employee data.',
            benefits: ['256-bit encryption', 'GDPR compliant', 'Role-based access', 'Audit logs'],
        },
        {
            icon: Users,
            title: 'Team Management',
            description: 'Organize employees by departments, roles, and permissions with ease.',
            benefits: ['Department grouping', 'Role hierarchy', 'Bulk actions', 'Team insights'],
        },
        {
            icon: Bell,
            title: 'Smart Notifications',
            description: 'Stay informed with customizable alerts for important events and deadlines.',
            benefits: ['Push notifications', 'Email alerts', 'Custom triggers', 'Priority levels'],
        },
        {
            icon: Globe,
            title: 'Multi-location Support',
            description: 'Manage teams across multiple offices, cities, or countries from one dashboard.',
            benefits: ['Geo-tracking', 'Timezone support', 'Location-based rules', 'Global view'],
        },
        {
            icon: Lock,
            title: 'Access Control',
            description: 'Fine-grained permissions ensure employees only see what they need to.',
            benefits: ['Role permissions', 'Data privacy', 'Action logging', 'Admin controls'],
        },
    ]

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <LandingHeader />

            {/* Hero Section */}
            <section className="py-20 lg:py-28 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-1.5 text-sm font-medium text-primary mb-6">
                            <Zap className="h-4 w-4" />
                            Powerful Features
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-6">
                            Everything you need to manage your workforce
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Comprehensive tools designed to streamline attendance, boost productivity, and simplify team management.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="group relative rounded-2xl border border-border bg-card p-8 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 hover:scale-105"
                            >
                                <div className="mb-4 inline-flex p-3 rounded-xl bg-primary-light text-primary group-hover:scale-110 transition-transform">
                                    <feature.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground mb-6">{feature.description}</p>
                                <ul className="space-y-2">
                                    {feature.benefits.map((benefit) => (
                                        <li key={benefit} className="flex items-center gap-2 text-sm">
                                            <Check className="h-4 w-4 text-success shrink-0" />
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-foreground/5 to-transparent" />
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative">
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-6">
                        Ready to experience these features?
                    </h2>
                    <p className="text-xl text-primary-foreground/90 mb-10">
                        Start your 14-day free trial today. No credit card required.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" variant="secondary" asChild className="shadow-lg">
                            <Link href="/signup">Start Free Trial</Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                            <Link href="/pricing">View Pricing</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
