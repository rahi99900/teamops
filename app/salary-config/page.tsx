'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useState } from 'react';
import { DollarSign, Save, Plus, Clock, Percent, Users, User, Send, Calculator, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSalary } from '@/contexts/SalaryContext';

export default function SalaryConfig() {
  const { toast } = useToast();
  const {
    globalConfig,
    roleSalaryConfigs,
    staffSalaries,
    updateGlobalConfig,
    updateRoleSalaryConfig,
    updateStaffSalary,
    addDeduction,
    calculateSalaries,
    publishSalaries,
  } = useSalary();

  const [activeTab, setActiveTab] = useState('global');
  const [deductionDialog, setDeductionDialog] = useState<{ open: boolean; staffId: string | null }>({ open: false, staffId: null });
  const [deductionForm, setDeductionForm] = useState({ reason: '', amount: '' });
  const [publishDialog, setPublishDialog] = useState(false);
  const [publishMonth, setPublishMonth] = useState('December');
  const [publishYear, setPublishYear] = useState(2024);

  const handleSaveGlobal = () => {
    calculateSalaries();
    toast({
      title: 'Configuration saved',
      description: 'Global salary configuration has been updated and salaries recalculated.',
    });
  };

  const handleAddDeduction = () => {
    if (!deductionDialog.staffId || !deductionForm.reason || !deductionForm.amount) return;

    addDeduction(deductionDialog.staffId, {
      reason: deductionForm.reason,
      amount: parseFloat(deductionForm.amount),
      date: new Date(),
      addedBy: 'CEO',
    });

    setDeductionDialog({ open: false, staffId: null });
    setDeductionForm({ reason: '', amount: '' });
    toast({
      title: 'Deduction added',
      description: 'The deduction has been added to the staff member\'s salary.',
    });
  };

  const handlePublish = () => {
    publishSalaries(publishMonth, publishYear, 'Michael Chen');
    setPublishDialog(false);
    toast({
      title: 'Salaries Published',
      description: `${publishMonth} ${publishYear} salaries have been published to all staff members.`,
    });
  };

  return (
    <ProtectedLayout>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Salary Configuration</h1>
            <p className="text-muted-foreground">Configure salary rules, manage staff salaries, and publish payroll</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveGlobal} className="gap-2">
              <Calculator className="h-4 w-4" />
              Recalculate All
            </Button>
            <Dialog open={publishDialog} onOpenChange={setPublishDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Send className="h-4 w-4" />
                  Publish Salaries
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Publish Salaries</DialogTitle>
                  <DialogDescription>
                    This will make salaries visible to all staff members. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Month</Label>
                      <Select value={publishMonth} onValueChange={setPublishMonth}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Select value={String(publishYear)} onValueChange={(v) => setPublishYear(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024">2024</SelectItem>
                          <SelectItem value="2025">2025</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-warning shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Publishing {staffSalaries.length} salary records</p>
                        <p className="text-sm text-muted-foreground">All staff will be able to view their salary details.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPublishDialog(false)}>Cancel</Button>
                  <Button onClick={handlePublish}>Publish Now</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="global">Global Settings</TabsTrigger>
            <TabsTrigger value="roles">Role-Based Config</TabsTrigger>
            <TabsTrigger value="staff">Staff Salaries</TabsTrigger>
          </TabsList>

          {/* Global Settings Tab */}
          <TabsContent value="global" className="space-y-6">
            {/* Payment Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Settings
                </CardTitle>
                <CardDescription>Configure base payment options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Type</Label>
                    <Select
                      value={globalConfig.paymentType}
                      onValueChange={(value: 'hourly' | 'daily' | 'weekly' | 'monthly') => updateGlobalConfig({ paymentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Base Hourly Rate ($)</Label>
                    <Input
                      type="number"
                      value={globalConfig.baseHourlyRate}
                      onChange={(e) => updateGlobalConfig({ baseHourlyRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={globalConfig.taxRate}
                        onChange={(e) => updateGlobalConfig({ taxRate: parseFloat(e.target.value) || 0 })}
                        className="pr-10"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overtime Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Overtime Settings
                </CardTitle>
                <CardDescription>Configure overtime pay multipliers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Overtime Pay</Label>
                    <p className="text-sm text-muted-foreground">
                      Pay extra for hours beyond regular work time
                    </p>
                  </div>
                  <Switch
                    checked={globalConfig.overtimeEnabled}
                    onCheckedChange={(checked) => updateGlobalConfig({ overtimeEnabled: checked })}
                  />
                </div>

                {globalConfig.overtimeEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4 border-l-2 border-primary">
                    <div className="space-y-2">
                      <Label>Overtime Rate</Label>
                      <Select
                        value={String(globalConfig.overtimeRate)}
                        onValueChange={(value) => updateGlobalConfig({ overtimeRate: parseFloat(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1.25">1.25x</SelectItem>
                          <SelectItem value="1.5">1.5x</SelectItem>
                          <SelectItem value="1.75">1.75x</SelectItem>
                          <SelectItem value="2">2.0x</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Weekend Rate</Label>
                      <Select
                        value={String(globalConfig.weekendRate)}
                        onValueChange={(value) => updateGlobalConfig({ weekendRate: parseFloat(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1.5">1.5x</SelectItem>
                          <SelectItem value="2">2.0x</SelectItem>
                          <SelectItem value="2.5">2.5x</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Holiday Rate</Label>
                      <Select
                        value={String(globalConfig.holidayRate)}
                        onValueChange={(value) => updateGlobalConfig({ holidayRate: parseFloat(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2.0x</SelectItem>
                          <SelectItem value="2.5">2.5x</SelectItem>
                          <SelectItem value="3">3.0x</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deductions */}
            <Card>
              <CardHeader>
                <CardTitle>Auto Deductions</CardTitle>
                <CardDescription>Configure automatic salary deductions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Late Arrival Deduction</Label>
                    <p className="text-sm text-muted-foreground">
                      Deduct amount for late clock-ins
                    </p>
                  </div>
                  <Switch
                    checked={globalConfig.lateDeduction}
                    onCheckedChange={(checked) => updateGlobalConfig({ lateDeduction: checked })}
                  />
                </div>
                {globalConfig.lateDeduction && (
                  <div className="pl-4 border-l-2 border-warning">
                    <Label>Deduction per late arrival ($)</Label>
                    <Input
                      type="number"
                      value={globalConfig.lateDeductionAmount}
                      onChange={(e) => updateGlobalConfig({ lateDeductionAmount: parseFloat(e.target.value) || 0 })}
                      className="w-48 mt-2"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Absence Deduction</Label>
                    <p className="text-sm text-muted-foreground">
                      Deduct amount for unexcused absences
                    </p>
                  </div>
                  <Switch
                    checked={globalConfig.absenceDeduction}
                    onCheckedChange={(checked) => updateGlobalConfig({ absenceDeduction: checked })}
                  />
                </div>
                {globalConfig.absenceDeduction && (
                  <div className="pl-4 border-l-2 border-destructive">
                    <Label>Deduction per absence ($)</Label>
                    <Input
                      type="number"
                      value={globalConfig.absenceDeductionAmount}
                      onChange={(e) => updateGlobalConfig({ absenceDeductionAmount: parseFloat(e.target.value) || 0 })}
                      className="w-48 mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Role-Based Config Tab */}
          <TabsContent value="roles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Role-Based Salary Configuration
                </CardTitle>
                <CardDescription>Set base salary and hourly rates for each role</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Hourly Rate</TableHead>
                      <TableHead>Bonus Eligible</TableHead>
                      <TableHead>OT Eligible</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roleSalaryConfigs.map((config) => (
                      <TableRow key={config.roleId}>
                        <TableCell className="font-medium">{config.roleName}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={config.baseSalary}
                            onChange={(e) => updateRoleSalaryConfig(config.roleId, { baseSalary: parseFloat(e.target.value) || 0 })}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={config.hourlyRate}
                            onChange={(e) => updateRoleSalaryConfig(config.roleId, { hourlyRate: parseFloat(e.target.value) || 0 })}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={config.bonusEligible}
                            onCheckedChange={(checked) => updateRoleSalaryConfig(config.roleId, { bonusEligible: checked })}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={config.overtimeEligible}
                            onCheckedChange={(checked) => updateRoleSalaryConfig(config.roleId, { overtimeEligible: checked })}
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => {
                            updateRoleSalaryConfig(config.roleId, config);
                            toast({ title: 'Role config saved' });
                          }}>
                            <Save className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Salaries Tab */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Individual Staff Salaries
                </CardTitle>
                <CardDescription>View and manage salaries for each staff member</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Work Hours</TableHead>
                      <TableHead>OT Hours</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Salary</TableHead>
                      <TableHead>Config Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffSalaries.map((staff) => (
                      <TableRow key={staff.staffId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{staff.staffName}</p>
                            <p className="text-sm text-muted-foreground">{staff.position}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{staff.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={staff.baseSalary}
                            onChange={(e) => updateStaffSalary(staff.staffId, { baseSalary: parseFloat(e.target.value) || 0 })}
                            className="w-28"
                          />
                        </TableCell>
                        <TableCell>{staff.workHours}h</TableCell>
                        <TableCell>{staff.overtimeHours}h</TableCell>
                        <TableCell>
                          <span className="text-destructive">-${staff.totalDeductions}</span>
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          ${staff.netSalary.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={staff.configType === 'auto' ? 'secondary' : staff.configType === 'manual' ? 'default' : 'outline'}>
                            {staff.configType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeductionDialog({ open: true, staffId: staff.staffId })}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Deduction
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Deduction Dialog */}
            <Dialog open={deductionDialog.open} onOpenChange={(open) => setDeductionDialog({ open, staffId: open ? deductionDialog.staffId : null })}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Deduction</DialogTitle>
                  <DialogDescription>
                    Add a manual deduction with a reason. This will be visible to the staff member.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea
                      placeholder="e.g., Late arrival on Dec 15..."
                      value={deductionForm.reason}
                      onChange={(e) => setDeductionForm(prev => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount ($)</Label>
                    <Input
                      type="number"
                      placeholder="50"
                      value={deductionForm.amount}
                      onChange={(e) => setDeductionForm(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeductionDialog({ open: false, staffId: null })}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddDeduction} variant="destructive">
                    Add Deduction
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>

    </ProtectedLayout>
  );
}
