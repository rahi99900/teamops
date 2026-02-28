'use client'

import Link from 'next/link'
import { LayoutGrid, Mail, Twitter, Linkedin, Github, MapPin, Phone } from 'lucide-react'

export function Footer() {
    const currentYear = new Date().getFullYear()

    const footerSections = [
        {
            title: 'Product',
            links: [
                { label: 'Features', href: '/features' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'Security', href: '#' },
                { label: 'Roadmap', href: '#' },
            ],
        },
        {
            title: 'Company',
            links: [
                { label: 'About', href: '/about' },
                { label: 'Blog', href: '#' },
                { label: 'Careers', href: '#' },
                { label: 'Contact', href: '#' },
            ],
        },
        {
            title: 'Resources',
            links: [
                { label: 'Documentation', href: '#' },
                { label: 'API Reference', href: '#' },
                { label: 'Support', href: '#' },
                { label: 'Status', href: '#' },
            ],
        },
        {
            title: 'Legal',
            links: [
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Cookie Policy', href: '#' },
                { label: 'GDPR', href: '#' },
            ],
        },
    ]

    return (
        <footer className="border-t border-border bg-card">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Main Footer Content */}
                <div className="py-12 lg:py-16">
                    <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
                        {/* Brand Column */}
                        <div className="col-span-2 md:col-span-2">
                            <Link href="/" className="flex items-center gap-2 mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                    <LayoutGrid className="h-6 w-6" />
                                </div>
                                <span className="text-xl font-bold">TeamOps</span>
                            </Link>
                            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                                Modern workforce management made simple. Track attendance, manage schedules, and boost productivity.
                            </p>

                            {/* Contact Info */}
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>123 Business St, Tech City</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>+1 (555) 123-4567</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span>support@teamops.com</span>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="flex items-center gap-3 mt-6">
                                {[
                                    { Icon: Twitter, href: '#', label: 'Twitter' },
                                    { Icon: Linkedin, href: '#', label: 'LinkedIn' },
                                    { Icon: Github, href: '#', label: 'GitHub' },
                                ].map(({ Icon, href, label }) => (
                                    <a
                                        key={label}
                                        href={href}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                                        aria-label={label}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Link Columns */}
                        {footerSections.map((section) => (
                            <div key={section.title} className="col-span-1">
                                <h3 className="font-semibold mb-4">{section.title}</h3>
                                <ul className="space-y-3">
                                    {section.links.map((link) => (
                                        <li key={link.label}>
                                            <Link
                                                href={link.href}
                                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            © {currentYear} TeamOps. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <Link href="/privacy" className="hover:text-primary transition-colors">
                                Privacy
                            </Link>
                            <Link href="/terms" className="hover:text-primary transition-colors">
                                Terms
                            </Link>
                            <Link href="#" className="hover:text-primary transition-colors">
                                Cookies
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
