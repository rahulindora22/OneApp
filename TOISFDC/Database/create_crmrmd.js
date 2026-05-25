/**
 * Creates the CRMRMD database on RDS and the check_in_out table.
 * Run once: node create_crmrmd.js
 */
const mysql = require('mysql2/promise');

const BASE = {
  host    : 'moh-poc-ai.cvyeg34elr4s.ap-south-1.rds.amazonaws.com',
  port    : 3306,
  user    : 'admin',
  password: 'BCCLpassword123',
  ssl     : { rejectUnauthorized: false },
};

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS check_in_out (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  record_id           VARCHAR(100)    NOT NULL          COMMENT 'Depot / segment ID (recordId)',
  record_type_checkin VARCHAR(20)     NOT NULL          COMMENT 'e.g. DEPO, RWA, CSP, OOH',
  user_ids            VARCHAR(100)    NOT NULL          COMMENT 'User ID (userIds)',
  mob_id              VARCHAR(100)    DEFAULT NULL      COMMENT 'Mobile device ID (mobId)',
  device_nm           VARCHAR(100)    DEFAULT NULL      COMMENT 'Device name (deviceNM)',

  -- Check-In fields
  check_in_lat        DECIMAL(15,10)  NOT NULL          COMMENT 'Check-in latitude',
  check_in_lng        DECIMAL(15,10)  NOT NULL          COMMENT 'Check-in longitude',
  check_in_time       DATETIME        NOT NULL
                      DEFAULT CURRENT_TIMESTAMP         COMMENT 'Auto-set on record insert',

  -- Check-Out fields (NULL until user checks out)
  check_out_lat       DECIMAL(15,10)  DEFAULT NULL      COMMENT 'Check-out latitude',
  check_out_lng       DECIMAL(15,10)  DEFAULT NULL      COMMENT 'Check-out longitude',
  check_out_time      DATETIME        DEFAULT NULL      COMMENT 'Set when user checks out',

  -- Metadata
  created_at          DATETIME        NOT NULL
                      DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        NOT NULL
                      DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_record_id   (record_id),
  INDEX idx_user_ids    (user_ids),
  INDEX idx_check_in_time (check_in_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function run() {
  // Step 1: connect without DB to create CRMRMD
  let conn = await mysql.createConnection(BASE);
  await conn.query('CREATE DATABASE IF NOT EXISTS `CRMRMD` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  console.log('✓  Database CRMRMD created (or already exists)');
  await conn.end();

  // Step 2: reconnect into CRMRMD and create table
  conn = await mysql.createConnection({ ...BASE, database: 'CRMRMD' });
  await conn.query(CREATE_TABLE);
  console.log('✓  Table check_in_out created (or already exists)');

  // Verify columns
  const [cols] = await conn.query('DESCRIBE check_in_out');
  console.log('\nTable structure:');
  cols.forEach(c => console.log(`  ${c.Field.padEnd(22)} ${c.Type.padEnd(20)} ${c.Null === 'YES' ? 'NULL' : 'NOT NULL'}`));

  await conn.end();
  console.log('\n✅  Done. Connect to CRMRMD → check_in_out to use the table.\n');
}

run().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
