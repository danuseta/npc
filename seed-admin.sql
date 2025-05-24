
-- Check if admin already exists
SELECT COUNT(*) FROM users WHERE role = 'admin';

-- Insert new admin if none exists
INSERT INTO users (name, email, password, phone, role, isActive, isEmailVerified, createdAt, updatedAt)
SELECT 'Administrator', 'admin@npc.com', '$2b$10$n.srue8Ee5nW9GMrz5c0HuVa3PUH9Ti6KPnXenX89oia0IScIU7P.', '+6289876543210', 'admin', true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin');

-- Update existing admin password
UPDATE users 
SET password = '$2b$10$n.srue8Ee5nW9GMrz5c0HuVa3PUH9Ti6KPnXenX89oia0IScIU7P.', updatedAt = NOW()
WHERE role = 'admin';
