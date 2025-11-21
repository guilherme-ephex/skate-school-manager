-- Add view_turmas permission for both ADMIN and TEACHER roles
-- This allows teachers to view the Turmas page in read-only mode

-- Add permission for TEACHER role
INSERT INTO role_permissions (role, permission, enabled)
VALUES ('TEACHER', 'view_turmas', true)
ON CONFLICT (role, permission) DO UPDATE SET enabled = true;

-- Add permission for ADMIN role
INSERT INTO role_permissions (role, permission, enabled)
VALUES ('ADMIN', 'view_turmas', true)
ON CONFLICT (role, permission) DO UPDATE SET enabled = true;

-- Verify the permissions were added
SELECT * FROM role_permissions WHERE permission = 'view_turmas' ORDER BY role;
