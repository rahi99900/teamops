'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'ceo' | 'admin' | 'manager' | 'employee' | 'unassigned';
export type AccountType = 'company' | 'employee';
export type CompanyStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  accountType: AccountType;
  avatar?: string;
  department?: string;
  position?: string;
  companyName?: string;
  companyId?: string;
  companyStatus: CompanyStatus;
  permissions: string[];
}

interface CompanyData {
  companyName: string;
  companySize?: string;
  industry?: string;
  companyAddress?: string;
  companyWebsite?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  signUpEmployee: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: any }>;
  signUpCompany: (email: string, password: string, fullName: string, phone: string, companyData: CompanyData) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  updateCompanyStatus: (status: CompanyStatus, companyName?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user:', userError);
        // Create default user if not found in users table yet
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser?.user) {
          const defaultUser: User = {
            id: authUser.user.id,
            firstName: authUser.user.user_metadata?.full_name?.split(' ')[0] || 'User',
            lastName: authUser.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            email: authUser.user.email || '',
            role: 'unassigned',
            accountType: 'employee',
            avatar: (authUser.user.user_metadata?.full_name?.charAt(0) || 'U').toUpperCase(),
            companyStatus: 'none',
            permissions: [],
          };
          return defaultUser;
        }
        return null;
      }

      // Type assertion for userData
      const user = userData as {
        id: string;
        email: string;
        full_name: string | null;
        company_id: string | null;
        is_active: boolean;
      };

      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      const role = (roleData as { role: string } | null)?.role || 'unassigned';

      // Fetch permissions based on role, scoped to the user's company
      let permissions: string[] = [];
      if (role !== 'unassigned' && user.company_id) {
        const { data: permData } = await supabase
          .from('permissions')
          .select('permission_key')
          .eq('role', role)
          .eq('company_id', user.company_id);

        permissions = (permData as { permission_key: string }[] | null)?.map(p => p.permission_key) || [];
      }

      // Fetch company info if user has company_id
      let companyName: string | undefined;
      if (user.company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('name')
          .eq('id', user.company_id)
          .single();

        companyName = (companyData as { name: string } | null)?.name || undefined;
      }

      // Determine company status based on role, not just is_active
      // A user with a real role assigned (non-unassigned) AND a company is 'approved'
      // A user linked to a company but with 'unassigned' role is still 'pending'
      let companyStatus: CompanyStatus = 'none';
      if (user.company_id && role !== 'unassigned') {
        companyStatus = 'approved';
      } else if (user.company_id && role === 'unassigned') {
        companyStatus = 'pending';
      }

      // Parse full_name into first and last name
      const nameParts = (user.full_name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const userProfile: User = {
        id: user.id,
        firstName,
        lastName,
        email: user.email,
        role: role as UserRole,
        accountType: role === 'ceo' ? 'company' : 'employee',
        avatar: firstName.charAt(0) + (lastName.charAt(0) || ''),
        companyId: user.company_id || undefined,
        companyName,
        companyStatus,
        permissions: role === 'ceo' ? ['all'] : permissions,
      };

      return userProfile;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  }, []);

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    if (supabaseUser) {
      const profile = await fetchUserProfile(supabaseUser.id);
      setUser(profile);
    }
  }, [supabaseUser, fetchUserProfile]);

  // Update company status locally (for UI updates before DB sync)
  const updateCompanyStatus = useCallback((status: CompanyStatus, companyName?: string) => {
    if (user) {
      setUser({
        ...user,
        companyStatus: status,
        companyName: companyName || user.companyName,
      });
    }
  }, [user]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);

        // Defer fetching user profile to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id).then(profile => {
              setUser(profile);
              setLoading(false);
            });
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user) {
        fetchUserProfile(session.user.id).then(profile => {
          setUser(profile);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  // Sign up for employee account (no company creation)
  const signUpEmployee = useCallback(async (email: string, password: string, fullName: string, phone?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          account_type: 'employee',
          phone: phone || null,
        },
      },
    });

    return { error };
  }, []);

  // Sign up for company account (CEO - creates company)
  const signUpCompany = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    companyData: CompanyData
  ) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          account_type: 'company',
          phone: phone || null,
          company_name: companyData.companyName,
          company_size: companyData.companySize,
          industry: companyData.industry,
          company_address: companyData.companyAddress,
          company_website: companyData.companyWebsite,
          company_role: companyData.role,
        },
      },
    });

    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        isAuthenticated: !!session && !!user,
        loading,
        signUpEmployee,
        signUpCompany,
        signIn,
        signOut,
        refreshUserData,
        updateCompanyStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
