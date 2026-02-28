export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = 'ceo' | 'admin' | 'manager' | 'employee';

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          timezone: string | null;
          work_start_time: string | null;
          work_end_time: string | null;
          lunch_start_time: string | null;
          lunch_end_time: string | null;
          camera_enabled: boolean;
          verification_limit_per_day: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          timezone?: string | null;
          work_start_time?: string | null;
          work_end_time?: string | null;
          lunch_start_time?: string | null;
          lunch_end_time?: string | null;
          camera_enabled?: boolean;
          verification_limit_per_day?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          timezone?: string | null;
          work_start_time?: string | null;
          work_end_time?: string | null;
          lunch_start_time?: string | null;
          lunch_end_time?: string | null;
          camera_enabled?: boolean;
          verification_limit_per_day?: number;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          company_id: string | null;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: AppRole | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          company_id?: string | null;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          role?: AppRole | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: AppRole | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: AppRole;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: AppRole;
        };
      };
      permissions: {
        Row: {
          id: string;
          company_id: string;
          role: AppRole;
          permission_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          role: AppRole;
          permission_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          role?: AppRole;
          permission_key?: string;
          created_at?: string;
        };
      };
      work_sessions: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          work_date: string;
          start_time: string;
          end_time: string | null;
          total_minutes: number | null;
          status: 'working' | 'completed';
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          work_date: string;
          start_time: string;
          end_time?: string | null;
          total_minutes?: number | null;
          status?: 'working' | 'completed';
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          work_date?: string;
          start_time?: string;
          end_time?: string | null;
          total_minutes?: number | null;
          status?: 'working' | 'completed';
          created_at?: string;
        };
      };
      break_sessions: {
        Row: {
          id: string;
          work_session_id: string;
          break_start: string;
          break_end: string | null;
          duration_minutes: number | null;
        };
        Insert: {
          id?: string;
          work_session_id: string;
          break_start: string;
          break_end?: string | null;
          duration_minutes?: number | null;
        };
        Update: {
          id?: string;
          work_session_id?: string;
          break_start?: string;
          break_end?: string | null;
          duration_minutes?: number | null;
        };
      };
      attendance_records: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          date: string;
          status: 'present' | 'absent' | 'partial' | 'leave';
          total_minutes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          date: string;
          status: 'present' | 'absent' | 'partial' | 'leave';
          total_minutes?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          date?: string;
          status?: 'present' | 'absent' | 'partial' | 'leave';
          total_minutes?: number | null;
          created_at?: string;
        };
      };
      verification_requests: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          requested_by: string;
          status: 'pending' | 'accepted' | 'skipped' | 'expired';
          verification_type: 'photo' | 'video';
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          requested_by: string;
          status?: 'pending' | 'accepted' | 'skipped' | 'expired';
          verification_type?: 'photo' | 'video';
          message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          requested_by?: string;
          status?: 'pending' | 'accepted' | 'skipped' | 'expired';
          verification_type?: 'photo' | 'video';
          message?: string | null;
          created_at?: string;
        };
      };
      verification_media: {
        Row: {
          id: string;
          verification_request_id: string;
          user_id: string;
          type: 'start' | 'verify' | 'end';
          file_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          verification_request_id: string;
          user_id: string;
          type: 'start' | 'verify' | 'end';
          file_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          verification_request_id?: string;
          user_id?: string;
          type?: 'start' | 'verify' | 'end';
          file_path?: string;
          created_at?: string;
        };
      };
      leave_requests: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          from_date: string;
          to_date: string;
          reason: string;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          from_date: string;
          to_date: string;
          reason: string;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          from_date?: string;
          to_date?: string;
          reason?: string;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
        };
      };
      salary_configs: {
        Row: {
          id: string;
          company_id: string;
          applies_to: 'global' | 'role' | 'user';
          target_id: string | null;
          salary_type: 'hourly' | 'monthly';
          rate: number;
          overtime_rate: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          applies_to: 'global' | 'role' | 'user';
          target_id?: string | null;
          salary_type: 'hourly' | 'monthly';
          rate: number;
          overtime_rate?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          applies_to?: 'global' | 'role' | 'user';
          target_id?: string | null;
          salary_type?: 'hourly' | 'monthly';
          rate?: number;
          overtime_rate?: number | null;
          created_at?: string;
        };
      };
      salary_records: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          month: string;
          total_minutes: number;
          overtime_minutes: number;
          final_salary: number;
          status: 'pending' | 'published';
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          month: string;
          total_minutes: number;
          overtime_minutes: number;
          final_salary: number;
          status?: 'pending' | 'published';
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          month?: string;
          total_minutes?: number;
          overtime_minutes?: number;
          final_salary?: number;
          status?: 'pending' | 'published';
          created_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          message: string;
          target_role: 'all' | 'manager' | 'employee' | 'admin' | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title: string;
          message: string;
          target_role?: 'all' | 'manager' | 'employee' | 'admin' | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          title?: string;
          message?: string;
          target_role?: 'all' | 'manager' | 'employee' | 'admin' | null;
          created_by?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          payload: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          payload?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          payload?: Json;
          is_read?: boolean;
          created_at?: string;
        };
      };
      company_applications: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: AppRole };
        Returns: boolean;
      };
      get_user_company_id: {
        Args: { _user_id: string };
        Returns: string | null;
      };
      is_manager_or_above: {
        Args: { _user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: AppRole;
    };
  };
}
