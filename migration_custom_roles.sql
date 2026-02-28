-- Custom Roles Table Migration
-- Run this in Supabase SQL Editor

-- Create custom_roles table to store user-defined roles
CREATE TABLE IF NOT EXISTS custom_roles (
    id TEXT PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Create custom_role_permissions table to store permissions for custom roles
CREATE TABLE IF NOT EXISTS custom_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id TEXT NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_key)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_roles_company ON custom_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_role_permissions_role ON custom_role_permissions(role_id);

-- Enable RLS
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_roles
CREATE POLICY "Users can view roles in their company"
    ON custom_roles FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "CEOs can create roles in their company"
    ON custom_roles FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT u.company_id 
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            WHERE u.id = auth.uid() AND ur.role = 'ceo'
        )
    );

CREATE POLICY "CEOs can update roles in their company"
    ON custom_roles FOR UPDATE
    USING (
        company_id IN (
            SELECT u.company_id 
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            WHERE u.id = auth.uid() AND ur.role = 'ceo'
        )
    );

CREATE POLICY "CEOs can delete roles in their company"
    ON custom_roles FOR DELETE
    USING (
        company_id IN (
            SELECT u.company_id 
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            WHERE u.id = auth.uid() AND ur.role = 'ceo'
        )
    );

-- RLS Policies for custom_role_permissions
CREATE POLICY "Users can view custom role permissions"
    ON custom_role_permissions FOR SELECT
    USING (
        role_id IN (
            SELECT id FROM custom_roles WHERE company_id IN (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "CEOs can manage custom role permissions"
    ON custom_role_permissions FOR ALL
    USING (
        role_id IN (
            SELECT cr.id FROM custom_roles cr
            JOIN users u ON u.company_id = cr.company_id
            JOIN user_roles ur ON ur.user_id = u.id
            WHERE u.id = auth.uid() AND ur.role = 'ceo'
        )
    );

-- Grant permissions
GRANT ALL ON custom_roles TO authenticated;
GRANT ALL ON custom_role_permissions TO authenticated;
