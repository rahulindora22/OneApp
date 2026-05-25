/**
 * Drops and recreates CRMRMD.segments with full Salesforce Segment__c field mapping.
 * Run: node create_crmrmd_segments_v2.js
 */
const mysql = require('mysql2/promise');
const BASE = {
  host: 'moh-poc-ai.cvyeg34elr4s.ap-south-1.rds.amazonaws.com',
  port: 3306, user: 'admin', password: 'BCCLpassword123',
  ssl: { rejectUnauthorized: false },
};

const DDL = `
CREATE TABLE IF NOT EXISTS segments (
  id                        VARCHAR(36)    NOT NULL PRIMARY KEY,
  record_type               VARCHAR(20)    NOT NULL DEFAULT 'RWA',

  -- Core identity (Salesforce: Name, Name_of_Society__c)
  name                      VARCHAR(255)   NULL,
  name_of_society           VARCHAR(255)   NULL,

  -- Address & location
  address                   TEXT           NULL,
  city                      VARCHAR(100)   NULL,
  pin_code                  VARCHAR(20)    NULL,
  locality_pincode          VARCHAR(20)    NULL,

  -- Classification
  slab                      VARCHAR(100)   NULL,
  premiumness               VARCHAR(50)    NULL,
  category                  VARCHAR(50)    NULL,
  delivery_mode             VARCHAR(100)   NULL,
  sub_category              VARCHAR(100)   NULL,
  type                      VARCHAR(100)   NULL,
  bp_code                   VARCHAR(100)   NULL,
  designations              TEXT           NULL,
  secondary_contacts        TEXT           NULL,
  tm_branch                 VARCHAR(50)    NULL,

  -- Flat counts (RWA)
  total_flats               INT            NULL,
  occupied_flats            INT            NULL,

  -- OOH-specific
  measure_of_potential      DECIMAL(15,2)  NULL,
  potential_count           INT            NULL,
  category_ooh              VARCHAR(100)   NULL,
  type_ooh                  VARCHAR(100)   NULL,
  sub_category_ooh          VARCHAR(100)   NULL,

  -- CSP-specific
  category_csp              VARCHAR(100)   NULL,

  -- Relationships (denormalized names for query performance)
  depot_id                  VARCHAR(36)    NULL,
  depot_name                VARCHAR(255)   NULL,
  locality_id               VARCHAR(36)    NULL,
  locality_name             VARCHAR(255)   NULL,
  segment_branch_id         VARCHAR(36)    NULL,
  branch_name               VARCHAR(255)   NULL,

  -- Geolocation
  approved_geo_lat          DECIMAL(15,10) NULL,
  approved_geo_lng          DECIMAL(15,10) NULL,
  pending_approval_lat      DECIMAL(15,10) NULL,
  pending_approval_lng      DECIMAL(15,10) NULL,
  pending_approval1_lat     DECIMAL(15,10) NULL,
  pending_approval1_lng     DECIMAL(15,10) NULL,

  -- Approval
  location_approval_status  VARCHAR(50)    NULL DEFAULT 'Pending',

  -- Check-in / Check-out
  last_check_in_date        DATE           NULL,
  check_in_location_name    VARCHAR(500)   NULL,
  check_out_lat             DECIMAL(15,10) NULL,
  check_out_lng             DECIMAL(15,10) NULL,
  check_out_time            DATETIME       NULL,
  has_pre_covid_count       TINYINT(1)     NOT NULL DEFAULT 0,

  -- Audit
  created_by                VARCHAR(100)   NULL,
  created_at                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_record_type     (record_type),
  INDEX idx_name_society    (name_of_society(100)),
  INDEX idx_depot           (depot_id),
  INDEX idx_locality        (locality_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function run() {
  const conn = await mysql.createConnection({ ...BASE, database: 'CRMRMD' });
  await conn.query('DROP TABLE IF EXISTS segments');
  console.log('✓  Dropped old CRMRMD.segments');
  await conn.query(DDL);
  console.log('✓  Created CRMRMD.segments (full Salesforce schema)');
  const [cols] = await conn.query('DESCRIBE segments');
  console.log(`\n   ${cols.length} columns created:`);
  cols.forEach(c => console.log(`   ${c.Field.padEnd(28)} ${c.Type}`));
  await conn.end();
  console.log('\n✅  Done.\n');
}
run().catch(e => { console.error(e.message); process.exit(1); });
