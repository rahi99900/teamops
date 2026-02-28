'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/types/database';

type SalaryConfigsRow = Database['public']['Tables']['salary_configs']['Row'];
type UsersRow = Database['public']['Tables']['users']['Row'];
type WorkSessionsRow = Database['public']['Tables']['work_sessions']['Row'];
type SalaryRecordsRow = Database['public']['Tables']['salary_records']['Row'];

export interface SalaryConfig {
  paymentType: 'hourly' | 'daily' | 'weekly' | 'monthly';
  baseHourlyRate: number;
  taxRate: number;
  overtimeEnabled: boolean;
  overtimeRate: number;
  weekendRate: number;
  holidayRate: number;
  lateDeduction: boolean;
  lateDeductionAmount: number;
  absenceDeduction: boolean;
  absenceDeductionAmount: number;
}

export interface StaffSalary {
  staffId: string;
  staffName: string;
  staffEmail: string;
  role: string;
  department: string;
  position: string;
  baseSalary: number;
  hourlyRate: number;
  workHours: number;
  overtimeHours: number;
  overtimePay: number;
  bonuses: number;
  deductions: DeductionItem[];
  totalDeductions: number;
  grossSalary: number;
  taxAmount: number;
  netSalary: number;
  status: 'draft' | 'published';
  configType: 'auto' | 'manual' | 'role-based';
}

export interface DeductionItem {
  id: string;
  reason: string;
  amount: number;
  date: Date;
  addedBy: string;
}

export interface RoleSalaryConfig {
  roleId: string;
  roleName: string;
  baseSalary: number;
  hourlyRate: number;
  bonusEligible: boolean;
  overtimeEligible: boolean;
}

export interface PublishedSalary {
  id: string;
  month: string;
  year: number;
  publishedAt: Date;
  publishedBy: string;
  staffSalaries: StaffSalary[];
}

interface SalaryContextType {
  globalConfig: SalaryConfig;
  roleSalaryConfigs: RoleSalaryConfig[];
  staffSalaries: StaffSalary[];
  publishedSalaries: PublishedSalary[];
  loading: boolean;
  updateGlobalConfig: (config: Partial<SalaryConfig>) => Promise<void>;
  updateRoleSalaryConfig: (roleId: string, config: Partial<RoleSalaryConfig>) => Promise<void>;
  updateStaffSalary: (staffId: string, salary: Partial<StaffSalary>) => void;
  addDeduction: (staffId: string, deduction: Omit<DeductionItem, 'id'>) => void;
  removeDeduction: (staffId: string, deductionId: string) => void;
  calculateSalaries: () => void;
  publishSalaries: (month: string, year: number, publishedBy: string) => Promise<void>;
  getStaffSalary: (staffId: string, month: string, year: number) => StaffSalary | undefined;
  refreshSalaryConfigs: () => Promise<void>;
}

const defaultGlobalConfig: SalaryConfig = {
  paymentType: 'monthly',
  baseHourlyRate: 25,
  taxRate: 15,
  overtimeEnabled: true,
  overtimeRate: 1.5,
  weekendRate: 2.0,
  holidayRate: 2.5,
  lateDeduction: true,
  lateDeductionAmount: 10,
  absenceDeduction: true,
  absenceDeductionAmount: 100,
};

const defaultRoleSalaryConfigs: RoleSalaryConfig[] = [
  { roleId: 'ceo', roleName: 'CEO / Chairman', baseSalary: 15000, hourlyRate: 100, bonusEligible: true, overtimeEligible: false },
  { roleId: 'admin', roleName: 'Admin', baseSalary: 7000, hourlyRate: 45, bonusEligible: true, overtimeEligible: true },
  { roleId: 'manager', roleName: 'Manager', baseSalary: 8000, hourlyRate: 50, bonusEligible: true, overtimeEligible: true },
  { roleId: 'employee', roleName: 'Employee', baseSalary: 5000, hourlyRate: 30, bonusEligible: true, overtimeEligible: true },
];

const SalaryContext = createContext<SalaryContextType | undefined>(undefined);

export function SalaryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [globalConfig, setGlobalConfig] = useState<SalaryConfig>(defaultGlobalConfig);
  const [roleSalaryConfigs, setRoleSalaryConfigs] = useState<RoleSalaryConfig[]>(defaultRoleSalaryConfigs);
  const [staffSalaries, setStaffSalaries] = useState<StaffSalary[]>([]);
  const [publishedSalaries, setPublishedSalaries] = useState<PublishedSalary[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch salary configs from database
  const fetchSalaryConfigs = async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch salary configs
      const { data: configs, error: configError } = await supabase
        .from('salary_configs')
        .select('*')
        .eq('company_id', user.companyId) as { data: SalaryConfigsRow[] | null; error: any };

      if (configError) throw configError;

      // Find global config
      const globalDbConfig = (configs || []).find(c => c.applies_to === 'global');
      if (globalDbConfig) {
        setGlobalConfig(prev => ({
          ...prev,
          paymentType: globalDbConfig.salary_type === 'hourly' ? 'hourly' : 'monthly',
          baseHourlyRate: globalDbConfig.rate || 25,
          overtimeRate: globalDbConfig.overtime_rate || 1.5,
        }));
      }

      // Build role configs from database
      const roleConfigs = (configs || []).filter(c => c.applies_to === 'role');
      const updatedRoleConfigs = defaultRoleSalaryConfigs.map(defaultConfig => {
        const dbConfig = roleConfigs.find(c => c.target_id === defaultConfig.roleId);
        if (dbConfig) {
          return {
            ...defaultConfig,
            baseSalary: dbConfig.salary_type === 'monthly' ? dbConfig.rate : defaultConfig.baseSalary,
            hourlyRate: dbConfig.salary_type === 'hourly' ? dbConfig.rate : defaultConfig.hourlyRate,
          };
        }
        return defaultConfig;
      });
      setRoleSalaryConfigs(updatedRoleConfigs);

      // Fetch staff members with their work data
      await fetchStaffSalaries();

      // Fetch published salary records
      await fetchPublishedSalaries();
    } catch (error) {
      console.error('Error fetching salary configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffSalaries = async () => {
    if (!user?.companyId) return;

    try {
      // Fetch users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('company_id', user.companyId)
        .eq('is_active', true);

      if (usersError) throw usersError;

      // Fetch user roles from user_roles table
      const userIds = (users || []).map(u => u.id);
      const { data: userRolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const rolesMap = new Map<string, string>();
      (userRolesData || []).forEach((ur: any) => {
        rolesMap.set(ur.user_id, ur.role);
      });

      // Fetch work sessions for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: workSessions, error: sessionsError } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('company_id', user.companyId)
        .gte('work_date', startOfMonth)
        .lte('work_date', endOfMonth) as { data: WorkSessionsRow[] | null; error: any };

      if (sessionsError) throw sessionsError;

      // Calculate salaries for each user
      const salaries: StaffSalary[] = (users || []).map((u: any) => {
        const userRole = rolesMap.get(u.id) || 'employee';
        const userSessions = workSessions?.filter(s => s.user_id === u.id) || [];
        const totalMinutes = userSessions.reduce((sum, s) => sum + (s.total_minutes || 0), 0);
        const workHours = Math.round(totalMinutes / 60);
        const overtimeHours = Math.max(0, workHours - 160); // Assuming 160 regular hours

        const roleConfig = roleSalaryConfigs.find(r => r.roleId === userRole) || defaultRoleSalaryConfigs.find(r => r.roleId === 'employee')!;
        const baseSalary = roleConfig.baseSalary;
        const hourlyRate = roleConfig.hourlyRate;
        const overtimePay = overtimeHours * hourlyRate * globalConfig.overtimeRate;
        const grossSalary = baseSalary + overtimePay;
        const taxAmount = (grossSalary * globalConfig.taxRate) / 100;
        const netSalary = grossSalary - taxAmount;

        return {
          staffId: u.id,
          staffName: u.full_name,
          staffEmail: u.email,
          role: userRole,
          department: 'General',
          position: userRole.charAt(0).toUpperCase() + userRole.slice(1),
          baseSalary,
          hourlyRate,
          workHours,
          overtimeHours,
          overtimePay,
          bonuses: 0,
          deductions: [],
          totalDeductions: 0,
          grossSalary,
          taxAmount,
          netSalary,
          status: 'draft' as const,
          configType: 'role-based' as const,
        };
      });

      setStaffSalaries(salaries);
    } catch (error) {
      console.error('Error fetching staff salaries:', error);
    }
  };

  const fetchPublishedSalaries = async () => {
    if (!user?.companyId) return;

    try {
      const { data, error } = await supabase
        .from('salary_records')
        .select(`
          *,
          users!salary_records_user_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('company_id', user.companyId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch roles for all users in results
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const rolesMap = new Map<string, string>();
      (rolesData || []).forEach((ur: any) => {
        rolesMap.set(ur.user_id, ur.role);
      });

      // Group by month
      const grouped: Record<string, PublishedSalary> = {};
      (data || []).forEach((record: any) => {
        const key = record.month;
        if (!grouped[key]) {
          const [month, year] = key.split('-');
          grouped[key] = {
            id: `pub-${key}`,
            month: new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' }),
            year: parseInt(year),
            publishedAt: new Date(record.created_at),
            publishedBy: 'System',
            staffSalaries: [],
          };
        }
        const userRole = rolesMap.get(record.user_id) || 'employee';
        grouped[key].staffSalaries.push({
          staffId: record.user_id,
          staffName: record.users?.full_name || 'Unknown',
          staffEmail: record.users?.email || '',
          role: userRole,
          department: 'General',
          position: userRole.charAt(0).toUpperCase() + userRole.slice(1),
          baseSalary: 0,
          hourlyRate: 0,
          workHours: Math.round(record.total_minutes / 60),
          overtimeHours: Math.round(record.overtime_minutes / 60),
          overtimePay: 0,
          bonuses: 0,
          deductions: [],
          totalDeductions: 0,
          grossSalary: record.final_salary,
          taxAmount: 0,
          netSalary: record.final_salary,
          status: 'published',
          configType: 'auto',
        });
      });

      setPublishedSalaries(Object.values(grouped));
    } catch (error) {
      console.error('Error fetching published salaries:', error);
    }
  };

  useEffect(() => {
    fetchSalaryConfigs();
  }, [user?.companyId]);

  const refreshSalaryConfigs = async () => {
    await fetchSalaryConfigs();
  };

  const updateGlobalConfig = async (config: Partial<SalaryConfig>) => {
    setGlobalConfig(prev => ({ ...prev, ...config }));

    if (!user?.companyId) return;

    try {
      // Check if global config exists
      const { data: existing } = await supabase
        .from('salary_configs')
        .select('id')
        .eq('company_id', user.companyId)
        .eq('applies_to', 'global')
        .maybeSingle();

      const salaryType = config.paymentType === 'hourly' ? 'hourly' : 'monthly';
      const rate = config.baseHourlyRate || globalConfig.baseHourlyRate;
      const overtimeRate = config.overtimeRate || globalConfig.overtimeRate;

      const client = supabase as any;
      if (existing) {
        await client.from('salary_configs').update({
          salary_type: salaryType,
          rate,
          overtime_rate: overtimeRate,
        }).eq('id', (existing as any).id);
      } else {
        await client.from('salary_configs').insert({
          company_id: user.companyId,
          applies_to: 'global',
          salary_type: salaryType,
          rate,
          overtime_rate: overtimeRate,
        });
      }
    } catch (error) {
      console.error('Error updating global config:', error);
    }
  };

  const updateRoleSalaryConfig = async (roleId: string, config: Partial<RoleSalaryConfig>) => {
    setRoleSalaryConfigs(prev =>
      prev.map(r => r.roleId === roleId ? { ...r, ...config } : r)
    );

    if (!user?.companyId) return;

    try {
      const roleConfig = roleSalaryConfigs.find(r => r.roleId === roleId);
      if (!roleConfig) return;

      // Check if role config exists
      const { data: existing } = await supabase
        .from('salary_configs')
        .select('id')
        .eq('company_id', user.companyId)
        .eq('applies_to', 'role')
        .eq('target_id', roleId)
        .maybeSingle();

      const rate = config.baseSalary || roleConfig.baseSalary;
      const hourlyRate = config.hourlyRate || roleConfig.hourlyRate;

      const client = supabase as any;
      if (existing) {
        await client.from('salary_configs').update({
          salary_type: 'monthly',
          rate,
          overtime_rate: hourlyRate,
        }).eq('id', (existing as any).id);
      } else {
        await client.from('salary_configs').insert({
          company_id: user.companyId,
          applies_to: 'role',
          target_id: roleId,
          salary_type: 'monthly',
          rate,
          overtime_rate: hourlyRate,
        });
      }
    } catch (error) {
      console.error('Error updating role salary config:', error);
    }
  };

  const updateStaffSalary = (staffId: string, salary: Partial<StaffSalary>) => {
    setStaffSalaries(prev =>
      prev.map(s => s.staffId === staffId ? { ...s, ...salary, configType: 'manual' } : s)
    );
  };

  const addDeduction = (staffId: string, deduction: Omit<DeductionItem, 'id'>) => {
    const newDeduction: DeductionItem = {
      ...deduction,
      id: `d-${Date.now()}`,
    };
    setStaffSalaries(prev =>
      prev.map(s => {
        if (s.staffId === staffId) {
          const newDeductions = [...s.deductions, newDeduction];
          const totalDeductions = newDeductions.reduce((sum, d) => sum + d.amount, 0);
          const netSalary = s.grossSalary - s.taxAmount - totalDeductions;
          return { ...s, deductions: newDeductions, totalDeductions, netSalary };
        }
        return s;
      })
    );
  };

  const removeDeduction = (staffId: string, deductionId: string) => {
    setStaffSalaries(prev =>
      prev.map(s => {
        if (s.staffId === staffId) {
          const newDeductions = s.deductions.filter(d => d.id !== deductionId);
          const totalDeductions = newDeductions.reduce((sum, d) => sum + d.amount, 0);
          const netSalary = s.grossSalary - s.taxAmount - totalDeductions;
          return { ...s, deductions: newDeductions, totalDeductions, netSalary };
        }
        return s;
      })
    );
  };

  const calculateSalaries = () => {
    setStaffSalaries(prev =>
      prev.map(s => {
        if (s.configType === 'manual') return s;

        const roleConfig = roleSalaryConfigs.find(r => r.roleId === s.role);
        const baseSalary = roleConfig?.baseSalary || s.baseSalary;
        const hourlyRate = roleConfig?.hourlyRate || s.hourlyRate;

        let grossSalary = baseSalary;

        if (globalConfig.paymentType === 'hourly') {
          grossSalary = s.workHours * hourlyRate;
        }

        let overtimePay = 0;
        if (globalConfig.overtimeEnabled && roleConfig?.overtimeEligible !== false) {
          overtimePay = s.overtimeHours * hourlyRate * globalConfig.overtimeRate;
        }

        grossSalary += overtimePay + s.bonuses;

        const taxAmount = (grossSalary * globalConfig.taxRate) / 100;
        const totalDeductions = s.deductions.reduce((sum, d) => sum + d.amount, 0);
        const netSalary = grossSalary - taxAmount - totalDeductions;

        return {
          ...s,
          baseSalary,
          hourlyRate,
          overtimePay,
          grossSalary,
          taxAmount,
          totalDeductions,
          netSalary,
        };
      })
    );
  };

  const publishSalaries = async (month: string, year: number, publishedBy: string) => {
    if (!user?.companyId) return;

    try {
      const monthKey = `${month.toLowerCase().slice(0, 3)}-${year}`;

      // Insert salary records for each staff member
      const records = staffSalaries.map(s => ({
        company_id: user.companyId,
        user_id: s.staffId,
        month: `${new Date(`${month} 1, ${year}`).getMonth() + 1}-${year}`,
        total_minutes: s.workHours * 60,
        overtime_minutes: s.overtimeHours * 60,
        final_salary: s.netSalary,
        status: 'published' as const,
      }));

      const { error } = await (supabase
        .from('salary_records')
        .insert(records as any) as any);

      if (error) throw error;

      // Update local state
      const newPublish: PublishedSalary = {
        id: `pub-${Date.now()}`,
        month,
        year,
        publishedAt: new Date(),
        publishedBy,
        staffSalaries: staffSalaries.map(s => ({ ...s, status: 'published' })),
      };
      setPublishedSalaries(prev => [newPublish, ...prev]);
      setStaffSalaries(prev => prev.map(s => ({ ...s, status: 'published' })));
    } catch (error) {
      console.error('Error publishing salaries:', error);
      throw error;
    }
  };

  const getStaffSalary = (staffId: string, month: string, year: number): StaffSalary | undefined => {
    const published = publishedSalaries.find(p => p.month === month && p.year === year);
    if (published) {
      return published.staffSalaries.find(s => s.staffId === staffId);
    }
    return staffSalaries.find(s => s.staffId === staffId);
  };

  return (
    <SalaryContext.Provider
      value={{
        globalConfig,
        roleSalaryConfigs,
        staffSalaries,
        publishedSalaries,
        loading,
        updateGlobalConfig,
        updateRoleSalaryConfig,
        updateStaffSalary,
        addDeduction,
        removeDeduction,
        calculateSalaries,
        publishSalaries,
        getStaffSalary,
        refreshSalaryConfigs,
      }}
    >
      {children}
    </SalaryContext.Provider>
  );
}

export function useSalary() {
  const context = useContext(SalaryContext);
  if (context === undefined) {
    throw new Error('useSalary must be used within a SalaryProvider');
  }
  return context;
}
