'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';;
import { useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Clock,
  Calendar,
  BarChart3,
  CheckCircle,
  Play,
  ArrowRight,
  Users,
  Shield,
  Camera,
  Smartphone,
  ChevronRight,
  Star,
  Zap,
  Globe,
  Lock,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Footer } from '@/components/layout/Footer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Animation wrapper component
const AnimateOnScroll = ({
  children,
  className = '',
  delay = 0,
  animation = 'fade-up'
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: 'fade-up' | 'fade-left' | 'fade-right' | 'scale' | 'bounce';
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  const animations = {
    'fade-up': 'translate-y-8 opacity-0',
    'fade-left': 'translate-x-8 opacity-0',
    'fade-right': '-translate-x-8 opacity-0',
    'scale': 'scale-95 opacity-0',
    'bounce': 'translate-y-4 opacity-0',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible ? 'translate-y-0 translate-x-0 scale-100 opacity-100' : animations[animation],
        className
      )}
    >
      {children}
    </div>
  );
};

// Pinging dot component
const PingDot = ({ color = 'bg-success', size = 'h-3 w-3' }: { color?: string; size?: string }) => (
  <span className="relative flex">
    <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', color)} />
    <span className={cn('relative inline-flex rounded-full', color, size)} />
  </span>
);

// Floating element animation
const FloatingElement = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <div
    className="animate-bounce"
    style={{
      animationDuration: '3s',
      animationDelay: `${delay}ms`,
    }}
  >
    {children}
  </div>
);

const features = [
  {
    icon: Clock,
    title: 'Real-time Tracking',
    description: "Monitor attendance as it happens with live updates. See who's in, who's late, and who's on break instantly.",
    color: 'text-primary',
    bg: 'bg-primary-light',
  },
  {
    icon: Camera,
    title: 'Photo Verification',
    description: 'Prevent buddy punching with secure selfie verification. AI-powered face matching ensures accurate attendance.',
    color: 'text-success',
    bg: 'bg-success-light',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Automate shift planning with AI-driven suggestions. Resolve conflicts before they happen and optimize coverage.',
    color: 'text-warning',
    bg: 'bg-warning-light',
  },
  {
    icon: BarChart3,
    title: 'Insightful Reporting',
    description: 'Make data-driven decisions with detailed reports on overtime, absenteeism, and project costs.',
    color: 'text-primary',
    bg: 'bg-primary-light',
  },
];

export default function Landing() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [counters, setCounters] = useState({ companies: 0, employees: 0, hours: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  // Track mouse for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animated counters
  useEffect(() => {
    const targets = { companies: 500, employees: 25000, hours: 1000000 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCounters({
        companies: Math.floor(targets.companies * easeOut),
        employees: Math.floor(targets.employees * easeOut),
        hours: Math.floor(targets.hours * easeOut),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);
  const pricingPlans = [
    {
      name: 'Starter',
      price: '$9',
      period: '/user/month',
      description: 'Perfect for small teams getting started.',
      features: ['Up to 10 employees', 'Basic attendance tracking', 'Email support', 'Monthly reports'],
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '$19',
      period: '/user/month',
      description: 'Best for growing teams with advanced needs.',
      features: ['Unlimited employees', 'Camera verification', 'Priority support', 'Advanced analytics', 'Custom integrations'],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations with custom requirements.',
      features: ['Everything in Pro', 'Dedicated account manager', 'SLA guarantee', 'On-premise option', 'API access'],
      highlighted: false,
    },
  ];

  const testimonials = [
    {
      quote: "TeamOps transformed how we manage our remote team. Attendance tracking is now effortless.",
      author: "Sarah Chen",
      role: "HR Director, TechFlow Inc.",
      avatar: "SC",
    },
    {
      quote: "The photo verification feature eliminated buddy punching completely. ROI within the first month!",
      author: "Michael Rodriguez",
      role: "Operations Manager, GlobalBank",
      avatar: "MR",
    },
    {
      quote: "Finally, a workforce management tool that's actually easy to use. Our team adopted it instantly.",
      author: "Emily Watson",
      role: "CEO, StartupHub",
      avatar: "EW",
    },
  ];

  const trustedCompanies = ['AcmeCorp', 'GlobalBank', 'TechFlow', 'EcoSys', 'Umbrella'];

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* Navigation */}
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
                    <Link
                      href={
                        user.permissions.includes('ceo-dashboard') ? '/dashboard/ceo' :
                          user.permissions.includes('manager-dashboard') ? '/dashboard/manager' :
                            '/dashboard'
                      }
                      className="cursor-pointer"
                    >
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => {
                    await signOut();
                    router.push('/');
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

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
          {/* Animated background with parallax */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div
              className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/15 blur-3xl"
              style={{
                transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`,
                transition: 'transform 0.3s ease-out',
              }}
            />
            <div
              className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-primary-light blur-3xl"
              style={{
                transform: `translate(${-mousePosition.x * 30}px, ${-mousePosition.y * 30}px)`,
                transition: 'transform 0.3s ease-out',
              }}
            />
            {/* Floating particles */}
            <div className="absolute top-20 left-20 animate-pulse" style={{ animationDelay: '0ms' }}>
              <div className="h-2 w-2 rounded-full bg-primary/30" />
            </div>
            <div className="absolute top-40 right-32 animate-pulse" style={{ animationDelay: '500ms' }}>
              <div className="h-3 w-3 rounded-full bg-success/30" />
            </div>
            <div className="absolute bottom-32 left-1/3 animate-pulse" style={{ animationDelay: '1000ms' }}>
              <div className="h-2 w-2 rounded-full bg-warning/30" />
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              <AnimateOnScroll animation="fade-right">
                <div className="max-w-2xl text-left">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-1.5 text-sm font-medium text-primary mb-6 animate-pulse">
                    <PingDot color="bg-primary" size="h-2 w-2" />
                    <span>Trusted by 500+ companies worldwide</span>
                  </div>

                  <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-6">
                    Streamline Your{' '}
                    <span className="text-primary relative">
                      Workforce
                      <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 10" fill="none">
                        <path d="M0 8 Q100 0 200 8" stroke="currentColor" strokeWidth="3" className="text-primary/30" />
                      </svg>
                    </span>{' '}
                    Management
                  </h1>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    Effortless attendance tracking, smart scheduling, and deep productivity insights designed for modern, agile teams.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {isAuthenticated && user ? (
                      <>
                        <Button size="lg" asChild className="shadow-lg shadow-primary/25 group hover:scale-105 transition-all">
                          <Link href={
                            user.permissions.includes('ceo-dashboard') ? '/dashboard/ceo' :
                              user.permissions.includes('manager-dashboard') ? '/dashboard/manager' :
                                '/dashboard'
                          }>
                            Manage Your Company
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="gap-2 hover:scale-105 transition-all">
                          <Link href="/profile">View Profile</Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="lg" asChild className="shadow-lg shadow-primary/25 group hover:scale-105 transition-all">
                          <Link href="/signup">
                            Start Free Trial
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="gap-2 hover:scale-105 transition-all group">
                          <div className="relative">
                            <Play className="h-4 w-4" />
                            <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
                          </div>
                          Watch Demo
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 group">
                      <CheckCircle className="h-4 w-4 text-success group-hover:scale-110 transition-transform" />
                      <span>No credit card required</span>
                    </div>
                    <div className="flex items-center gap-2 group">
                      <CheckCircle className="h-4 w-4 text-success group-hover:scale-110 transition-transform" />
                      <span>14-day free trial</span>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-left" delay={200}>
                <div className="relative lg:ml-auto w-full">
                  <div className="relative rounded-2xl bg-card p-2 shadow-2xl ring-1 ring-border transform hover:scale-[1.02] transition-all duration-500 hover:shadow-primary/10">
                    <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary-light via-accent to-primary-light flex items-center justify-center p-4">
                      <div className="w-full h-full bg-card rounded-lg shadow-xl border border-border p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-success-light flex items-center justify-center">
                            <PingDot color="bg-success" />
                          </div>
                          <div className="flex-1">
                            <div className="h-3 w-24 bg-muted rounded mb-1" />
                            <div className="h-2 w-16 bg-muted rounded" />
                          </div>
                          <div className="text-2xl font-bold font-timer tabular-nums">08:45:23</div>
                        </div>
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div className="bg-success-light rounded-lg p-2 flex flex-col justify-center items-center transform hover:scale-105 transition-transform cursor-default">
                            <div className="flex items-center gap-1">
                              <div className="text-lg font-bold text-success">24</div>
                              <PingDot color="bg-success" size="h-1.5 w-1.5" />
                            </div>
                            <div className="text-xs text-muted-foreground">Active</div>
                          </div>
                          <div className="bg-warning-light rounded-lg p-2 flex flex-col justify-center items-center transform hover:scale-105 transition-transform cursor-default">
                            <div className="text-lg font-bold text-warning">3</div>
                            <div className="text-xs text-muted-foreground">Break</div>
                          </div>
                          <div className="bg-muted rounded-lg p-2 flex flex-col justify-center items-center transform hover:scale-105 transition-transform cursor-default">
                            <div className="text-lg font-bold text-muted-foreground">5</div>
                            <div className="text-xs text-muted-foreground">Offline</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating badges */}
                  <FloatingElement delay={0}>
                    <div className="absolute -top-4 -right-4 bg-success text-success-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5">
                      <PingDot color="bg-success-foreground" size="h-1.5 w-1.5" />
                      Live Tracking
                    </div>
                  </FloatingElement>

                  <FloatingElement delay={500}>
                    <div className="absolute -bottom-4 -left-4 bg-card text-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg border border-border flex items-center gap-1.5">
                      <Lock className="h-3 w-3 text-primary" />
                      256-bit Encrypted
                    </div>
                  </FloatingElement>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-card border-y border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {[
                { value: counters.companies, suffix: '+', label: 'Companies Trust Us', icon: Globe },
                { value: counters.employees, suffix: '+', label: 'Employees Managed', icon: Users },
                { value: (counters.hours / 1000000).toFixed(1), suffix: 'M+', label: 'Hours Tracked', icon: Clock },
              ].map((stat, index) => (
                <AnimateOnScroll key={stat.label} animation="scale" delay={index * 150}>
                  <div className="group cursor-default">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 rounded-xl bg-primary-light group-hover:scale-110 transition-transform">
                        <stat.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-primary tabular-nums">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}{stat.suffix}
                    </div>
                    <p className="text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="border-b border-border bg-background py-12 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <AnimateOnScroll>
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-8">
                Trusted by industry leaders worldwide
              </p>
            </AnimateOnScroll>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center">
              {trustedCompanies.map((company, index) => (
                <AnimateOnScroll key={company} delay={index * 100} animation="fade-up">
                  <div className="opacity-40 hover:opacity-100 transition-all duration-300 cursor-default hover:scale-110">
                    <span className="text-xl font-bold">{company}</span>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Features Section */}
        <section id="features" className="py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="mb-16 text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-1.5 text-sm font-medium text-primary mb-4">
                <Zap className="h-4 w-4" />
                Powerful Features
              </div>
              <h3 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Everything you need to manage your workforce
              </h3>
              <p className="mt-4 text-xl text-muted-foreground">
                Stop using spreadsheets. TeamOps gives you the tools to manage time, people, and projects in one place.
              </p>
            </AnimateOnScroll>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Feature List */}
              <AnimateOnScroll animation="fade-right">
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <button
                      key={feature.title}
                      onClick={() => setActiveFeature(index)}
                      className={cn(
                        'w-full text-left p-6 rounded-xl border transition-all duration-300 transform hover:scale-[1.02]',
                        activeFeature === index
                          ? 'bg-card border-primary shadow-lg shadow-primary/10'
                          : 'bg-background border-border hover:border-primary/50 hover:shadow-md'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn('p-3 rounded-lg transition-transform', feature.bg, activeFeature === index && 'scale-110')}>
                          <feature.icon className={cn('h-6 w-6', feature.color)} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{feature.title}</h4>
                          <p className={cn(
                            'text-sm text-muted-foreground transition-all duration-300',
                            activeFeature === index ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden lg:opacity-70 lg:h-auto'
                          )}>
                            {feature.description}
                          </p>
                        </div>
                        <ChevronRight className={cn(
                          'h-5 w-5 transition-all duration-300',
                          activeFeature === index ? 'rotate-90 text-primary scale-110' : 'text-muted-foreground'
                        )} />
                      </div>
                      {activeFeature === index && (
                        <div className="mt-4 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </AnimateOnScroll>

              {/* Feature Preview */}
              <AnimateOnScroll animation="fade-left" delay={200}>
                <div className="relative">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary-light via-accent to-primary-light p-8 flex items-center justify-center">
                    <div className="w-full h-full bg-card rounded-xl shadow-2xl p-6 flex flex-col items-center justify-center gap-6 transition-all duration-500">
                      <div className={cn('p-6 rounded-2xl transition-all duration-300 transform hover:scale-110', features[activeFeature].bg)}>
                        {(() => {
                          const Icon = features[activeFeature].icon;
                          return <Icon className={cn('h-16 w-16 transition-all duration-300', features[activeFeature].color)} />;
                        })()}
                      </div>
                      <div className="text-center">
                        <h4 className="text-xl font-bold mb-2">{features[activeFeature].title}</h4>
                        <p className="text-muted-foreground">{features[activeFeature].description}</p>
                      </div>
                      {/* Progress indicator */}
                      <div className="flex gap-2 mt-4">
                        {features.map((_, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'h-2 rounded-full transition-all duration-300',
                              idx === activeFeature ? 'w-8 bg-primary' : 'w-2 bg-muted'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute -top-4 -left-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl animate-pulse" />
                  <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-primary/10 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-card border-y border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="mb-16 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">How It Works</h2>
              <p className="mt-4 text-xl text-muted-foreground">
                Get started in minutes, not hours
              </p>
            </AnimateOnScroll>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '01', icon: Users, title: 'Create Your Company', desc: 'Sign up and invite your team members' },
                { step: '02', icon: Smartphone, title: 'Install the App', desc: 'Employees install the PWA on their devices' },
                { step: '03', icon: Shield, title: 'Start Tracking', desc: 'Track attendance with photo verification' },
              ].map((item, index) => (
                <AnimateOnScroll key={item.step} animation="fade-up" delay={index * 150}>
                  <div className="relative text-center group cursor-default">
                    <div className="text-6xl font-bold text-primary/10 mb-4 group-hover:text-primary/20 transition-colors">{item.step}</div>
                    <div className="inline-flex p-4 rounded-2xl bg-primary-light mb-4 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all">
                      <item.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                    {/* Connecting line */}
                    {index < 2 && (
                      <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/20 to-transparent" />
                    )}
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="mb-16 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Simple, Transparent Pricing</h2>
              <p className="mt-4 text-xl text-muted-foreground">
                Choose the plan that fits your team. No hidden fees.
              </p>
            </AnimateOnScroll>

            <div className="grid md:grid-cols-3 gap-8 items-start">
              {pricingPlans.map((plan, index) => (
                <AnimateOnScroll key={plan.name} animation="scale" delay={index * 150}>
                  <div
                    className={cn(
                      'relative rounded-2xl p-8 transition-all duration-300 hover:scale-105',
                      plan.highlighted
                        ? 'bg-primary text-primary-foreground shadow-2xl shadow-primary/25 scale-105 z-10'
                        : 'bg-card border border-border shadow-soft hover:shadow-lg'
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
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-4xl font-extrabold">{plan.price}</span>
                      <span className={cn('ml-1 text-sm', plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                        {plan.period}
                      </span>
                    </div>
                    <p className={cn('mt-2 text-sm', plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                      {plan.description}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm">
                          <CheckCircle className={cn('h-5 w-5 shrink-0', plan.highlighted ? 'text-primary-foreground' : 'text-success')} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={cn('w-full mt-8 transition-transform hover:scale-105', plan.highlighted && 'bg-background text-foreground hover:bg-muted')}
                      variant={plan.highlighted ? 'secondary' : 'default'}
                      asChild
                    >
                      <Link href="/signup">Get Started</Link>
                    </Button>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20 bg-card border-y border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll className="mb-16 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Loved by Teams Everywhere</h2>
              <p className="mt-4 text-xl text-muted-foreground">
                See what our customers have to say about TeamOps.
              </p>
            </AnimateOnScroll>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <AnimateOnScroll key={testimonial.author} animation="fade-up" delay={index * 150}>
                  <div className="bg-background rounded-2xl p-8 border border-border shadow-soft hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                    <div className="flex gap-1 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-warning text-warning group-hover:scale-110 transition-transform" style={{ transitionDelay: `${i * 50}ms` }} />
                      ))}
                    </div>
                    <p className="text-foreground mb-6 leading-relaxed italic">&quot;{testimonial.quote}&quot;</p>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold group-hover:scale-110 transition-transform">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.author}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
          <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-primary/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <AnimateOnScroll className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl mb-6">
              Ready to Transform Your Workforce Management?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join 500+ companies already using TeamOps to streamline their operations and boost productivity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated && user ? (
                <>
                  <Button size="lg" asChild className="shadow-lg shadow-primary/25 hover:scale-105 transition-all group">
                    <Link href={
                      user.permissions.includes('ceo-dashboard') ? '/dashboard/ceo' :
                        user.permissions.includes('manager-dashboard') ? '/dashboard/manager' :
                          '/dashboard'
                    }>
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="hover:scale-105 transition-all">
                    View Reports
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" asChild className="shadow-lg shadow-primary/25 hover:scale-105 transition-all group">
                    <Link href="/signup">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="hover:scale-105 transition-all">
                    Schedule Demo
                  </Button>
                </>
              )}
            </div>
            <p className="mt-6 text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </AnimateOnScroll>
        </section>
      </main>

      <Footer />
    </div>
  );
}