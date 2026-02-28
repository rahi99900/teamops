'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useState } from 'react';
import { DollarSign, Download, Clock, TrendingUp, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSalary } from '@/contexts/SalaryContext';
import { useAuth } from '@/contexts/AuthContext';

export default function MySalary() {
  const { user } = useAuth();
  const { publishedSalaries, staffSalaries } = useSalary();
  const [selectedPeriod, setSelectedPeriod] = useState('december-2024');

  // Get available periods from published salaries
  const periods = publishedSalaries.map(p => ({
    value: `${p.month.toLowerCase()}-${p.year}`,
    label: `${p.month} ${p.year}`,
    published: true,
  }));

  // Add current month as draft if not published
  if (!periods.find(p => p.value === 'december-2024')) {
    periods.unshift({ value: 'december-2024', label: 'December 2024 (Draft)', published: false });
  }

  // Get salary data for selected period
  const getSalaryData = () => {
    const [month, yearStr] = selectedPeriod.split('-');
    const year = parseInt(yearStr);

    // Find in published salaries
    const published = publishedSalaries.find(p =>
      p.month.toLowerCase() === month && p.year === year
    );

    if (published) {
      const salary = published.staffSalaries.find(s => s.staffId === user?.id || s.staffEmail === user?.email);
      if (salary) {
        return { ...salary, isPublished: true, publishedAt: published.publishedAt };
      }
    }

    // Fallback to current staff salaries (draft)
    const draft = staffSalaries.find(s => s.staffId === user?.id || s.staffEmail === user?.email);
    if (draft) {
      return { ...draft, isPublished: false };
    }

    // Demo fallback
    return {
      baseSalary: 5000,
      overtimePay: 450,
      overtimeHours: 12,
      bonuses: 200,
      deductions: [{ id: '1', reason: 'Tax', amount: 750, date: new Date(), addedBy: 'System' }],
      totalDeductions: 150,
      grossSalary: 5650,
      taxAmount: 847,
      netSalary: 4653,
      workHours: 168,
      status: 'published',
      isPublished: true,
    };
  };

  const salaryData = getSalaryData();

  const payHistory = publishedSalaries.slice(0, 4).map(p => {
    const staffSalary = p.staffSalaries.find(s => s.staffId === user?.id || s.staffEmail === user?.email);
    return {
      month: `${p.month} ${p.year}`,
      amount: staffSalary?.netSalary || 0,
      status: 'paid' as const,
      publishedAt: p.publishedAt,
    };
  });

  return (
    <ProtectedLayout>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Salary</h1>
            <p className="text-muted-foreground">View your salary details and payment history</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periods.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    <span className="flex items-center gap-2">
                      {p.label}
                      {p.published && <CheckCircle className="h-3 w-3 text-success" />}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Status Banner */}
        {!salaryData.isPublished && (
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium">Salary Not Published Yet</p>
              <p className="text-sm text-muted-foreground">This is a preview. Final salary will be available once published by management.</p>
            </div>
          </div>
        )}

        {/* Net Salary Card */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-primary-foreground/80 text-sm">Net Salary</p>
                <div className="text-4xl font-bold mt-1">
                  ${salaryData.netSalary?.toLocaleString() || '0'}
                </div>
                <p className="text-primary-foreground/80 text-sm mt-2 flex items-center gap-2">
                  {selectedPeriod.split('-').map((s, i) => i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s).join(' ')}
                  {salaryData.isPublished ? (
                    <Badge variant="secondary" className="bg-white/20 text-white">Published</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-warning/80 text-white">Draft</Badge>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-primary-foreground/80 text-sm">Work Hours</p>
                  <p className="text-xl font-semibold">{salaryData.workHours || 168}h</p>
                </div>
                <div className="text-right">
                  <p className="text-primary-foreground/80 text-sm">OT Hours</p>
                  <p className="text-xl font-semibold">{salaryData.overtimeHours || 0}h</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Base Salary</p>
                  <p className="text-xl font-semibold">${salaryData.baseSalary?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overtime Pay</p>
                  <p className="text-xl font-semibold text-success">+${salaryData.overtimePay || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bonuses</p>
                  <p className="text-xl font-semibold text-success">+${salaryData.bonuses || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <DollarSign className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deductions</p>
                  <p className="text-xl font-semibold text-destructive">-${salaryData.totalDeductions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Salary Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Salary Breakdown</CardTitle>
            <CardDescription>Detailed breakdown of your salary components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Base Salary</span>
                <span className="font-semibold">${salaryData.baseSalary?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Overtime Pay ({salaryData.overtimeHours || 0} hours)</span>
                <span className="font-semibold text-success">+${salaryData.overtimePay || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Bonuses</span>
                <span className="font-semibold text-success">+${salaryData.bonuses || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Gross Salary</span>
                <span className="font-semibold">${salaryData.grossSalary?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Tax Deduction ({((salaryData.taxAmount || 0) / (salaryData.grossSalary || 1) * 100).toFixed(0)}%)</span>
                <span className="font-semibold text-destructive">-${salaryData.taxAmount || 0}</span>
              </div>

              {/* Manual Deductions */}
              {salaryData.deductions && salaryData.deductions.length > 0 && (
                <div className="pl-4 border-l-2 border-destructive space-y-2">
                  {salaryData.deductions.map((d: any, i: number) => (
                    <div key={d.id || i} className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">{d.reason}</span>
                      <span className="font-medium text-destructive">-${d.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center py-3 text-lg border-t-2 border-border">
                <span className="font-semibold">Net Salary</span>
                <span className="font-bold text-primary">${salaryData.netSalary?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payHistory.length > 0 ? payHistory.map((payment) => (
                <div
                  key={payment.month}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{payment.month}</p>
                      <p className="text-sm text-muted-foreground">
                        Published on {payment.publishedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${payment.amount.toLocaleString()}</p>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      Paid
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payment history available yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </ProtectedLayout>
  );
}
