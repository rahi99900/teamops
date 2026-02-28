'use client'

import Link from 'next/link'
import { Zap, Target, Heart, Award } from 'lucide-react';
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/layout/Footer'
import { LandingHeader } from '@/components/layout/LandingHeader'

export default function AboutPage() {
    const values = [
        {
            icon: Target,
            title: 'Mission-Driven',
            description: 'We believe in empowering teams to work smarter, not harder.',
        },
        {
            icon: Heart,
            title: 'Customer First',
            description: 'Your success is our success. We go above and beyond to support you.',
        },
        {
            icon: Zap,
            title: 'Innovation',
            description: 'Constantly evolving our platform with cutting-edge features.',
        },
        {
            icon: Award,
            title: 'Excellence',
            description: 'Committed to delivering the highest quality product and service.',
        },
    ]

    const stats = [
        { value: '500+', label: 'Companies' },
        { value: '25K+', label: 'Employees Managed' },
        { value: '1M+', label: 'Hours Tracked' },
        { value: '99.9%', label: 'Uptime' },
    ]

    const team = [
        { name: 'Sarah Johnson', role: 'CEO & Founder', avatar: 'SJ' },
        { name: 'Michael Chen', role: 'CTO', avatar: 'MC' },
        { name: 'Emily Rodriguez', role: 'Head of Product', avatar: 'ER' },
        { name: 'David Kim', role: 'Head of Customer Success', avatar: 'DK' },
    ]

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <LandingHeader />

            {/* Hero Section */}
            <section className="py-20 lg:py-28 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-6">
                            We&apos;re on a mission to revolutionize workforce management
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            TeamOps was founded in 2020 with a simple goal: make workforce management effortless for teams of all sizes.
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-card border-y border-border">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {stats.map((stat) => (
                            <div key={stat.label} className="group cursor-default">
                                <div className="text-4xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                                    {stat.value}
                                </div>
                                <p className="text-muted-foreground">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Story Section */}
            <section className="py-20">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-extrabold mb-8 text-center">Our Story</h2>
                    <div className="prose prose-lg max-w-none">
                        <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                            Founded in 2020, TeamOps was born from a simple frustration: managing team attendance shouldn&apos;t be complicated. Our founders,
                            having experienced the pain of outdated time-tracking systems firsthand, set out to create something better.
                        </p>
                        <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                            What started as a simple attendance tracker has evolved into a comprehensive workforce management platform trusted by over 500
                            companies worldwide. We&apos;ve helped teams save thousands of hours and eliminate attendance-related headaches.
                        </p>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            Today, TeamOps continues to innovate, adding new features and integrations based on feedback from our amazing community of users.
                            We&apos;re just getting started, and we&apos;re excited to have you join us on this journey.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-20 bg-card border-y border-border">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-extrabold mb-12 text-center">Our Values</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value) => (
                            <div
                                key={value.title}
                                className="text-center group cursor-default"
                            >
                                <div className="inline-flex p-4 rounded-2xl bg-primary-light mb-4 group-hover:scale-110 transition-transform">
                                    <value.icon className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="font-bold mb-2">{value.title}</h3>
                                <p className="text-sm text-muted-foreground">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-extrabold mb-12 text-center">Meet Our Team</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {team.map((member) => (
                            <div key={member.name} className="text-center group">
                                <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-primary-light text-primary font-bold text-2xl group-hover:scale-110 transition-transform">
                                    {member.avatar}
                                </div>
                                <h3 className="font-semibold mb-1">{member.name}</h3>
                                <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary text-primary-foreground">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-6">
                        Join the TeamOps family
                    </h2>
                    <p className="text-xl text-primary-foreground/90 mb-10">
                        Become part of our growing community of forward-thinking companies.
                    </p>
                    <Button size="lg" variant="secondary" asChild className="shadow-lg">
                        <Link href="/signup">Get Started Today</Link>
                    </Button>
                </div>
            </section>

            <Footer />
        </div>
    )
}
