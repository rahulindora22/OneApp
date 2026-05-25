/**
 * Run once to create/update the password for a user in the CRMRMD database.
 * Usage: node set-password.js
 */
require('dotenv').config();
const mysql   = require('mysql2/promise');
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const uuidv4  = () => crypto.randomUUID();

const EMAIL    = 'Mahesh.dubey@timesofindia.com';
const PASSWORD = 'Admin@123';

(async () => {
  const conn = await mysql.createConnection({
    host:               process.env.DB_HOST,
    port:               parseInt(process.env.DB_PORT || '3306'),
    database:           process.env.DB_NAME,
    user:               process.env.DB_USER,
    password:           process.env.DB_PASSWORD,
    ssl:                { rejectUnauthorized: false },
    timezone:           '+05:30',
  });

  try {
    const hash = await bcrypt.hash(PASSWORD, 10);

    const [rows] = await conn.execute(
      'SELECT id, is_active, password_hash FROM CRMRMD.users WHERE email = ? LIMIT 1',
      [EMAIL]
    );

    if (rows.length === 0) {
      // User does not exist — create a minimal record
      const newId = uuidv4();
      await conn.execute(
        `INSERT INTO CRMRMD.users
           (id, username, name, email, is_active, password_hash)
         VALUES (?, ?, ?, ?, 1, ?)`,
        [newId, EMAIL, 'Mahesh Dubey', EMAIL, hash]
      );
      console.log(`✓ User created: ${EMAIL}  (id: ${newId})`);
    } else {
      const user = rows[0];
      // Ensure account is active and update the password hash
      await conn.execute(
        'UPDATE CRMRMD.users SET password_hash = ?, is_active = 1 WHERE email = ?',
        [hash, EMAIL]
      );
      console.log(`✓ Password updated for: ${EMAIL}  (id: ${user.id}, was_active: ${user.is_active})`);
    }

    console.log('Done. You can now log in with:');
    console.log(`  username: ${EMAIL}`);
    console.log(`  password: ${PASSWORD}`);
  } finally {
    await conn.end();
  }
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
