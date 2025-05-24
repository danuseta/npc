const bcrypt = require('bcryptjs');
const fs = require('fs');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'npc_ecommerce',
  dialect: 'mysql'
};

const adminData = {
  name: 'Administrator',
  email: 'admin@npc.com',
  password: 'admin123',
  phone: '+6289876543210',
  role: 'admin',
  isActive: true,
  isEmailVerified: true
};

async function generateAdminSQL() {
  try {
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);
    
    const checkSQL = `
SELECT COUNT(*) FROM users WHERE role = 'admin';
`;
    
    const insertSQL = `
INSERT INTO users (name, email, password, phone, role, isActive, isEmailVerified, createdAt, updatedAt)
SELECT '${adminData.name}', '${adminData.email}', '${hashedPassword}', '${adminData.phone}', '${adminData.role}', ${adminData.isActive}, ${adminData.isEmailVerified}, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin');
`;
    
    const updateSQL = `
UPDATE users 
SET password = '${hashedPassword}', updatedAt = NOW()
WHERE role = 'admin';
`;
    
    const fullSQL = checkSQL + insertSQL + updateSQL;
    
    const filename = 'seed-admin.sql';
    fs.writeFileSync(filename, fullSQL);
    
    console.log(`SQL commands generated and saved to ${filename}`);
    console.log('\nAdmin credentials:');
    console.log(`- Email: ${adminData.email}`);
    console.log(`- Password: ${adminData.password}`);
    console.log('\nTo apply these changes:');
    console.log(`1. Log in to your MySQL server: mysql -u ${DB_CONFIG.user} -p ${DB_CONFIG.database}`);
    console.log(`2. Execute the SQL file: source ${filename}`);
    
  } catch (error) {
    console.error('Error generating admin SQL:', error);
  }
}

generateAdminSQL();
