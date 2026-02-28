'use client'

import Link from 'next/link'
import { Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/layout/Footer'
import { LandingHeader } from '@/components/layout/LandingHeader'
import { cn } from '@/lib/utils'

export default function PricingPage() {
    const plans = [
        {
            name: 'Starter',
            price: '$9',
            period: '/user/month',
            description: 'Perfect for small teams getting started with workforce management.',
            features: [
                'Up to 10 employees',
                'Basic attendance tracking',
                'Email support',
                'Monthly reports',
                'Mobile app access',
                '99.9% uptime SLA',
            ],
            highlighted: false,
            cta: 'Start Free Trial',
        },
        {
            name: 'Professional',
            price: '$19',
            period: '/user/month',
            description: 'Best for growing teams with advanced needs and integrations.',
            features: [
                'Unlimited employees',
                'Photo verification',
                'Priority support',
                'Advanced analytics',
                'Custom integrations',
                'API access',
                'SSO authentication',
                'Dedicated account manager',
            ],
            highlighted: true,
            cta: 'Start Free Trial',
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            period: '',
            description: 'For large organizations with custom requirements and compliance needs.',
            features: [
                'Everything in Pro',
                'Unlimited integrations',
                'Custom contracts',
                'SLA guarantee',
                'On-premise deployment option',
                'Advanced security features',
                '24/7 phone support',
                'Training & onboarding',
            ],
            highlighted: false,
            cta: 'Contact Sales',
        },
    ]

    const faqs = [
        {
            question: 'Can I change plans later?',
            answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
        },
        {
            question: 'Is there a free trial?',
            answer: 'Yes, we offer a 14-day free trial for all plans. No credit card required.',
        },
        {
            question: 'What payment methods do you accept?',
            answer: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.',
        },
        {
            question: 'Can I cancel anytime?',
            answer: 'Absolutely. You can cancel your subscription at any time with no cancellation fees.',
        },
    ]

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <LandingHeader />

            {/* Hero Section */}
            <section className="py-20 lg:py-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-6">
                            Simple, transparent pricing
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Choose the plan that fits your team. All plans include a 14-day free trial.
                        </p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-3 gap-8 items-start mb-20">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={cn(
                                    'relative rounded-2xl p-8 transition-all duration-300',
                                    plan.highlighted
                                        ? 'bg-primary text-primary-foreground shadow-2xl shadow-primary/25 scale-105 z-10 hover:scale-110'
                                        : 'bg-card border border-border shadow-sm hover:shadow-lg hover:scale-105'
                                )}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="bg-success text-success-foreground text-xs font-bold px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                                            <Star className="h-3 w-3" />
                                            Most Popular
                                        </span>
                                    </div>
                                )}
                                <h3 className="text-lg font-bold mb-4">{plan.name}</h3>
                                <div className="mb-6">
                                    <div className="flex items-baseline">
                                        <span className="text-4xl font-extrabold">{plan.price}</span>
                                        <span className={cn('ml-1 text-sm', plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                                            {plan.period}
                                        </span>
                                    </div>
                                    <p className={cn('mt-2 text-sm', plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                                        {plan.description}
                                    </p>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-3 text-sm">
                                            <Check className={cn('h-5 w-5 shrink-0', plan.highlighted ? 'text-primary-foreground' : 'text-success')} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className={cn('w-full', plan.highlighted && 'bg-background text-foreground hover:bg-muted')}
                                    variant={plan.highlighted ? 'secondary' : 'default'}
                                    asChild
                                >
                                    <Link href={plan.cta === 'Contact Sales' ? '#' : '/signup'}>{plan.cta}</Link>
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* FAQs */}
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl font-extrabold text-center mb-12">Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            {faqs.map((faq) => (
                                <div key={faq.question} className="bg-card rounded-xl p-6 border border-border">
                                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                                    <p className="text-muted-foreground">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-card border-y border-border">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-6">
                        Still have questions?
                    </h2>
                    <p className="text-xl text-muted-foreground mb-10">
                        Our team is here to help. Schedule a demo or contact sales.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" asChild>
                            <Link href="#">Schedule Demo</Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link href="#">Contact Sales</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
