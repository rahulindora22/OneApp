/**
 * Creates the CRMRMD.segments table on the RDS instance.
 * Run once: node Database/create_crmrmd_segments.js
 */
const mysql = require('mysql2/promise');

const BASE = {
  host: 'moh-poc-ai.cvyeg34elr4s.ap-south-1.rds.amazonaws.com',
  port: 3306,
  user: 'admin',
  password: 'BCCLpassword123',
  ssl: { rejectUnauthorized: false },
};

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS segments (
  id              VARCHAR(36)  NOT NULL,
  record_type     VARCHAR(20)  NOT NULL DEFAULT 'RWA',
  name_of_society VARCHAR(255) DEFAULT NULL,
  address         TEXT         DEFAULT NULL,
  slab            VARCHAR(50)  DEFAULT NULL,
  premiumness     VARCHAR(50)  DEFAULT NULL,
  category        VARCHAR(50)  DEFAULT NULL,
  city            VARCHAR(100) DEFAULT NULL,
  depot_id        VARCHAR(36)  DEFAULT NULL,
  depot_name      VARCHAR(255) DEFAULT NULL,
  locality_id     VARCHAR(36)  DEFAULT NULL,
  locality_name   VARCHAR(255) DEFAULT NULL,
  pin_code        VARCHAR(20)  DEFAULT NULL,
  branch_id       VARCHAR(36)  DEFAULT NULL,
  branch_name     VARCHAR(255) DEFAULT NULL,
  total_flats     INT          DEFAULT NULL,
  occupied_flats  INT          DEFAULT NULL,
  delivery_mode   VARCHAR(100) DEFAULT NULL,
  created_by      VARCHAR(100) DEFAULT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

(async () => {
  let conn;
  try {
    console.log('Connecting to CRMRMD database...');
    conn = await mysql.createConnection({ ...BASE, database: 'CRMRMD' });

    console.log('Running CREATE TABLE IF NOT EXISTS segments ...');
    await conn.execute(CREATE_TABLE_SQL);

    console.log('SUCCESS: CRMRMD.segments table is ready.');
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
})();
