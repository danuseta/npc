
-- Check if superadmin already exists
SELECT COUNT(*) FROM users WHERE role = 'superadmin';

-- Insert new superadmin if none exists
INSERT INTO users (name, email, password, phone, role, isActive, isEmailVerified, createdAt, updatedAt)
SELECT 'Super Administrator', 'admin@npcnusantara.com', '$2b$10$yqVEHRUW0MDdsLTBYmQUa.5OLAjXgFP3QAySmCtZzMG5VbRv3H5M.', '+6281234567890', 'superadmin', true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'superadmin');

-- Update existing superadmin password
UPDATE users 
SET password = '$2b$10$yqVEHRUW0MDdsLTBYmQUa.5OLAjXgFP3QAySmCtZzMG5VbRv3H5M.', updatedAt = NOW()
WHERE role = 'superadmin';
