-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing views if any
DROP VIEW IF EXISTS v_employee_directory CASCADE;
DROP VIEW IF EXISTS v_leave_summary CASCADE;

-- Drop existing tables if any
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS asset_history CASCADE;
DROP TABLE IF EXISTS asset_allocations CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS approval_history CASCADE;
DROP TABLE IF EXISTS leave_applications CASCADE;
DROP TABLE IF EXISTS leave_balance CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS employee_skills CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS employee_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Drop existing types if any
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS leave_status CASCADE;
DROP TYPE IF EXISTS asset_status CASCADE;

-- Types
CREATE TYPE user_role AS ENUM ('Admin', 'Manager', 'HR', 'Employee');
CREATE TYPE leave_status AS ENUM ('Pending', 'Approved', 'Rejected');
CREATE TYPE asset_status AS ENUM ('Available', 'Allocated', 'Maintenance', 'Retired');

-- 1. Departments Table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'Employee',
    is_active BOOLEAN DEFAULT TRUE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Employee Profiles Table
CREATE TABLE employee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    avatar_url VARCHAR(500),
    document_urls TEXT[] DEFAULT '{}',
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Skills Table
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 5. Employee Skills Many-to-Many
CREATE TABLE employee_skills (
    employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (employee_id, skill_id)
);

-- 6. Leave Types Table
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    days_allowed INTEGER NOT NULL DEFAULT 15
);

-- 7. Leave Balance Table
CREATE TABLE leave_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    allocated_days INTEGER NOT NULL,
    used_days INTEGER NOT NULL DEFAULT 0,
    pending_days INTEGER NOT NULL DEFAULT 0,
    UNIQUE (user_id, leave_type_id)
);

-- 8. Leave Applications Table
CREATE TABLE leave_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status leave_status DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Approval History Table
CREATE TABLE approval_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES leave_applications(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action leave_status NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Assets Table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL,
    status asset_status NOT NULL DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Asset Allocations Table
CREATE TABLE asset_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    allocated_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    returned_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- 12. Asset History Table
CREATE TABLE asset_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Audit Logs Table (JSONB)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL,
    row_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Notifications Table (Event-driven)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_employee_profiles_user_id ON employee_profiles(user_id);
CREATE INDEX idx_leave_balance_user_type ON leave_balance(user_id, leave_type_id);
CREATE INDEX idx_leave_applications_user ON leave_applications(user_id);
CREATE INDEX idx_asset_allocations_asset ON asset_allocations(asset_id);
CREATE INDEX idx_asset_allocations_user ON asset_allocations(user_id);
CREATE INDEX idx_audit_logs_table_row ON audit_logs(table_name, row_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- -------------------------------------------------------------
-- Audit Trigger Function & Triggers
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id_text TEXT;
    current_user_id_uuid UUID;
    old_val JSONB := NULL;
    new_val JSONB := NULL;
    r_id UUID;
BEGIN
    -- Try to get the active user ID from the session config
    BEGIN
        current_user_id_text := current_setting('app.current_user_id', true);
        IF current_user_id_text IS NOT NULL AND current_user_id_text <> '' THEN
            current_user_id_uuid := current_user_id_text::UUID;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        current_user_id_uuid := NULL;
    END;

    IF (TG_OP = 'DELETE') THEN
        old_val := to_jsonb(OLD);
        r_id := OLD.id;
    ELSIF (TG_OP = 'UPDATE') THEN
        old_val := to_jsonb(OLD);
        new_val := to_jsonb(NEW);
        r_id := NEW.id;
    ELSIF (TG_OP = 'INSERT') THEN
        new_val := to_jsonb(NEW);
        r_id := NEW.id;
    END IF;

    INSERT INTO audit_logs (table_name, action, row_id, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, TG_OP, r_id, old_val, new_val, current_user_id_uuid);

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply Audit Triggers to Major Tables
CREATE TRIGGER tr_audit_departments AFTER INSERT OR UPDATE OR DELETE ON departments FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER tr_audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER tr_audit_employee_profiles AFTER INSERT OR UPDATE OR DELETE ON employee_profiles FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER tr_audit_leave_applications AFTER INSERT OR UPDATE OR DELETE ON leave_applications FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER tr_audit_assets AFTER INSERT OR UPDATE OR DELETE ON assets FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER tr_audit_asset_allocations AFTER INSERT OR UPDATE OR DELETE ON asset_allocations FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- -------------------------------------------------------------
-- Database Views
-- -------------------------------------------------------------

-- View 1: Employee Directory View
CREATE OR REPLACE VIEW v_employee_directory AS
SELECT 
    u.id AS user_id,
    u.email,
    u.role,
    u.is_active,
    u.department_id,
    d.name AS department_name,
    d.code AS department_code,
    ep.first_name,
    ep.last_name,
    ep.phone,
    ep.salary,
    ep.avatar_url,
    ep.document_urls,
    ep.hire_date,
    COALESCE(
        json_agg(json_build_object('id', s.id, 'name', s.name)) FILTER (WHERE s.id IS NOT NULL),
        '[]'
    ) AS skills
FROM users u
LEFT JOIN employee_profiles ep ON u.id = ep.user_id
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN employee_skills es ON u.id = es.employee_id
LEFT JOIN skills s ON es.skill_id = s.id
GROUP BY u.id, d.name, d.code, ep.first_name, ep.last_name, ep.phone, ep.salary, ep.avatar_url, ep.document_urls, ep.hire_date;

-- View 2: Leave Summary View
CREATE OR REPLACE VIEW v_leave_summary AS
SELECT 
    la.id AS leave_application_id,
    la.user_id,
    ep.first_name,
    ep.last_name,
    d.name AS department_name,
    la.leave_type_id,
    lt.name AS leave_type_name,
    la.start_date,
    la.end_date,
    la.reason,
    la.status,
    la.created_at,
    COALESCE(
        json_agg(
            json_build_object(
                'approver_first_name', ep_ap.first_name,
                'approver_last_name', ep_ap.last_name,
                'action', ah.action,
                'comments', ah.comments,
                'created_at', ah.created_at
            )
        ) FILTER (WHERE ah.id IS NOT NULL),
        '[]'
    ) AS approvals
FROM leave_applications la
JOIN users u ON la.user_id = u.id
JOIN employee_profiles ep ON u.id = ep.user_id
LEFT JOIN departments d ON u.department_id = d.id
JOIN leave_types lt ON la.leave_type_id = lt.id
LEFT JOIN approval_history ah ON la.id = ah.application_id
LEFT JOIN users u_ap ON ah.approver_id = u_ap.id
LEFT JOIN employee_profiles ep_ap ON u_ap.id = ep_ap.user_id
GROUP BY la.id, ep.first_name, ep.last_name, d.name, lt.name;
