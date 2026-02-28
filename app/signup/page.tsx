'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';;
import { LayoutGrid, Eye, EyeOff, Building2, CheckCircle, User, Briefcase, Users, Globe, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type AccountType = 'company' | 'employee';

export default function Signup() {
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Common fields
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    agreeToTerms: false,
    // Company fields
    companyName: '',
    companySize: '',
    industry: '',
    companyAddress: '',
    companyWebsite: '',
    role: '',
    // Employee fields
    companyCode: '',
    department: '',
    position: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { signUpEmployee, signUpCompany, isAuthenticated, loading: authLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Show loading spinner while checking auth state
  if (authLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreeToTerms) {
      toast({
        title: 'Terms required',
        description: 'Please agree to the terms of service.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      let error;

      if (accountType === 'company') {
        // CEO signup - create company
        const result = await signUpCompany(
          formData.email,
          formData.password,
          fullName,
          formData.phone,
          {
            companyName: formData.companyName,
            companySize: formData.companySize,
            industry: formData.industry,
            companyAddress: formData.companyAddress,
            companyWebsite: formData.companyWebsite,
            role: formData.role,
          }
        );
        error = result.error;
      } else {
        // Employee signup
        const result = await signUpEmployee(
          formData.email,
          formData.password,
          fullName,
          formData.phone
        );
        error = result.error;
      }

      if (error) {
        // Handle specific error messages
        let errorMessage = 'Something went wrong. Please try again.';

        if (error.message?.includes('already registered')) {
          errorMessage = 'This email is already registered. Please log in instead.';
        } else if (error.message?.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message?.includes('weak password')) {
          errorMessage = 'Password is too weak. Please use a stronger password.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast({
          title: 'Signup failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account, then log in.',
      });
      router.push('/login');
    } catch {
      toast({
        title: 'Signup failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStepProgress = () => {
    if (!accountType) return 0;
    if (accountType === 'employee') {
      return step === 1 ? 50 : 100;
    }
    return step === 1 ? 33 : step === 2 ? 66 : 100;
  };

  const getTotalSteps = () => (accountType === 'company' ? 3 : 2);

  const features = [
    'Free 14-day trial',
    'No credit card required',
    'Cancel anytime',
    '24/7 Support',
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Retail',
    'Manufacturing',
    'Education',
    'Construction',
    'Hospitality',
    'Other',
  ];

  const companySizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '500+ employees',
  ];

  const companyRoles = [
    'CEO / Founder',
    'Chairman',
    'Admin',
    'HR Manager',
    'Operations Manager',
  ];

  // Account Type Selection
  if (!accountType) {
    return (
      <div className="min-h-screen flex bg-background">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-12 lg:px-16 py-12">
          <div className="max-w-lg">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
                <LayoutGrid className="h-6 w-6" />
              </div>
            </div>

            <h1 className="text-4xl font-black mb-4 leading-tight lg:text-5xl">
              Choose how you want to use TeamOps
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Whether you&apos;re managing a team or joining one, we&apos;ve got you covered.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-soft"
                >
                  <CheckCircle className="h-5 w-5 text-success shrink-0" />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Account Type Selection */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8 lg:max-w-lg">
          <div className="w-full max-w-md mx-auto">
            {/* Mobile Logo */}
            <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">TeamOps</span>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold mb-2">Get Started with TeamOps</h2>
                <p className="text-muted-foreground">Choose your account type</p>
              </div>

              <div className="space-y-4">
                {/* Company Account */}
                <button
                  onClick={() => setAccountType('company')}
                  className="w-full p-6 rounded-xl border-2 border-border bg-background hover:border-primary hover:bg-primary-light/50 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary-light text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Company Account</h3>
                      <p className="text-sm text-muted-foreground">
                        Register your company and manage employees. For CEOs, Admins, and Managers.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-primary-light text-primary">Manage Team</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary-light text-primary">Reports</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary-light text-primary">Settings</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Employee Account */}
                <button
                  onClick={() => setAccountType('employee')}
                  className="w-full p-6 rounded-xl border-2 border-border bg-background hover:border-primary hover:bg-primary-light/50 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-success-light text-success group-hover:bg-success group-hover:text-success-foreground transition-colors">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Employee Account</h3>
                      <p className="text-sm text-muted-foreground">
                        Join an existing company as an employee. Track your attendance and view your work hours.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-success-light text-success">Clock In/Out</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-success-light text-success">My Attendance</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-success-light text-success">My Salary</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-12 lg:px-16 py-12">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
              <LayoutGrid className="h-6 w-6" />
            </div>
          </div>

          <h1 className="text-4xl font-black mb-4 leading-tight lg:text-5xl">
            {accountType === 'company'
              ? 'Set up your company on TeamOps'
              : 'Join your team on TeamOps'}
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {accountType === 'company'
              ? 'Create your company account and start managing your workforce efficiently.'
              : 'Connect with your company and start tracking your work hours.'}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-soft"
              >
                <CheckCircle className="h-5 w-5 text-success shrink-0" />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>

          {/* Decorative UI Preview */}
          <div className="relative h-64 w-full rounded-xl bg-gradient-to-br from-primary-light to-accent overflow-hidden group">
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <svg className="w-full h-full text-primary" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" fillOpacity="0.1" />
              </svg>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-card rounded-lg shadow-elevated border border-border flex flex-col p-4 gap-3 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <div className="flex gap-2 items-center">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="h-4 w-32 bg-muted rounded" />
              </div>
              <div className="h-2 w-full bg-muted rounded mt-2">
                <div className="h-full bg-primary rounded" style={{ width: `${getStepProgress()}%` }} />
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2 mt-2">
                <div className="bg-primary-light rounded" />
                <div className="bg-primary-light rounded" />
                <div className="bg-primary-light rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8 lg:max-w-lg overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">TeamOps</span>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
            <div className="mb-6">
              <button
                onClick={() => {
                  if (step > 1) {
                    setStep(step - 1);
                  } else {
                    setAccountType(null);
                  }
                }}
                className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
              >
                ← Back
              </button>
              <h2 className="text-2xl font-bold mb-1">
                {accountType === 'company'
                  ? step === 1
                    ? 'Create Admin Account'
                    : step === 2
                      ? 'Company Details'
                      : 'Almost Done!'
                  : step === 1
                    ? 'Create Your Account'
                    : 'Join Your Company'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {accountType === 'company'
                  ? step === 1
                    ? 'Enter your personal details'
                    : step === 2
                      ? 'Tell us about your company'
                      : 'Review and confirm'
                  : step === 1
                    ? 'Enter your personal details'
                    : 'Enter your company code to join'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Step {step} of {getTotalSteps()}</span>
                <span>{getStepProgress()}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${getStepProgress()}%` }}
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Personal Details */}
              {step === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="Jane"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="jane@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={formData.phone}
                        onChange={handleChange}
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="password">Password</Label>
                      <span className="text-xs text-muted-foreground">Min. 8 characters</span>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {/* Password Strength */}
                    <div className="mt-1 flex gap-1 h-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            'flex-1 rounded-full',
                            passwordStrength >= level
                              ? level <= 1
                                ? 'bg-destructive'
                                : level <= 2
                                  ? 'bg-warning'
                                  : 'bg-success'
                              : 'bg-muted'
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full h-11 font-semibold mt-4"
                    disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.password}
                  >
                    Continue
                  </Button>
                </>
              )}

              {/* Step 2: Company Details (for Company Account) */}
              {accountType === 'company' && step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="companyName"
                        name="companyName"
                        type="text"
                        placeholder="Acme Inc."
                        value={formData.companyName}
                        onChange={handleChange}
                        required
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Your Role</Label>
                    <Select onValueChange={(value) => handleSelectChange('role', value)} value={formData.role}>
                      <SelectTrigger className="h-11">
                        <Briefcase className="h-5 w-5 text-muted-foreground mr-2" />
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {companyRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company Size</Label>
                    <Select onValueChange={(value) => handleSelectChange('companySize', value)} value={formData.companySize}>
                      <SelectTrigger className="h-11">
                        <Users className="h-5 w-5 text-muted-foreground mr-2" />
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        {companySizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select onValueChange={(value) => handleSelectChange('industry', value)} value={formData.industry}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 h-11"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 h-11 font-semibold"
                      disabled={!formData.companyName || !formData.role}
                    >
                      Continue
                    </Button>
                  </div>
                </>
              )}

              {/* Step 3: Additional Company Info (for Company Account) */}
              {accountType === 'company' && step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Company Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="companyAddress"
                        name="companyAddress"
                        type="text"
                        placeholder="123 Business St, City"
                        value={formData.companyAddress}
                        onChange={handleChange}
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyWebsite">Company Website (Optional)</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="companyWebsite"
                        name="companyWebsite"
                        type="url"
                        placeholder="https://yourcompany.com"
                        value={formData.companyWebsite}
                        onChange={handleChange}
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="agreeToTerms" className="text-sm text-muted-foreground">
                      I agree to the{' '}
                      <Link href="/terms" className="font-medium text-primary hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="font-medium text-primary hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="flex-1 h-11"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-11 font-semibold shadow-primary"
                      disabled={isLoading || !formData.agreeToTerms}
                    >
                      {isLoading ? 'Creating...' : 'Create Company'}
                    </Button>
                  </div>
                </>
              )}

              {/* Step 2: Join Company (for Employee Account) - Optional */}
              {accountType === 'employee' && step === 2 && (
                <>
                  <div className="p-4 rounded-lg bg-primary-light border border-primary/20 mb-4">
                    <p className="text-sm text-primary">
                      You can skip this step and join a company later from your dashboard.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyCode">Company Code (Optional)</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="companyCode"
                        name="companyCode"
                        type="text"
                        placeholder="ACME-2024 (leave empty to skip)"
                        value={formData.companyCode}
                        onChange={handleChange}
                        className="h-11 pl-10 uppercase"
                      />
                    </div>
                  </div>

                  {formData.companyCode && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          name="department"
                          type="text"
                          placeholder="e.g., Engineering, Sales"
                          value={formData.department}
                          onChange={handleChange}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Input
                          id="position"
                          name="position"
                          type="text"
                          placeholder="e.g., Software Engineer"
                          value={formData.position}
                          onChange={handleChange}
                          className="h-11"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-start gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="agreeToTerms" className="text-sm text-muted-foreground">
                      I agree to the{' '}
                      <Link href="/terms" className="font-medium text-primary hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="font-medium text-primary hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 h-11"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-11 font-semibold shadow-primary"
                      disabled={isLoading || !formData.agreeToTerms}
                    >
                      {isLoading ? 'Creating...' : formData.companyCode ? 'Join Company' : 'Create Account'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
