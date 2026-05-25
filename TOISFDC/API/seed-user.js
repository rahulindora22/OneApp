/**
 * Seed admin user into CRMRMD.users
 * Run: node seed-user.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db     = require('./src/config/database');

async function seed() {
  const hash = await bcrypt.hash('Admin@123', 10);

  await db.query(`
    INSERT INTO CRMRMD.users
      (id, name, first_name, last_name, email, username, is_active, password_hash)
    VALUES
      (UUID(), 'Mahesh Dubey', 'Mahesh', 'Dubey',
       'Mahesh.dubey@timesofindia.com',
       'Mahesh.dubey@timesofindia.com',
       1, ?)
    ON DUPLICATE KEY UPDATE
      password_hash = VALUES(password_hash),
      is_active     = 1
  `, [hash]);

  console.log('✓ User seeded:');
  console.log('  Email    : Mahesh.dubey@timesofindia.com');
  console.log('  Password : Admin@123');
  process.exit(0);
}

seed().catch(e => { console.error('Seed error:', e.message); process.exit(1); });
