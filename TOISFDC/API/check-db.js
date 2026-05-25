require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }, timezone: '+05:30',
  });

  const q = async (label, sql, params = []) => {
    try {
      const [rows] = await conn.execute(sql, params);
      console.log(`\n[${label}] → ${rows.length} rows`);
      if (rows.length > 0) console.log('  Sample:', JSON.stringify(rows[0]).substring(0, 200));
    } catch (e) { console.log(`[${label}] ERROR: ${e.message}`); }
  };

  await q('DATABASES',         `SHOW DATABASES`);
  await q('CRMRMD TABLES',     `SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA='CRMRMD' ORDER BY TABLE_NAME`);
  await q('leads count',       `SELECT COUNT(*) AS cnt FROM CRMRMD.leads`);
  await q('leads sample',      `SELECT id, last_name, first_name, company, mobile, locality_name, created_at FROM CRMRMD.leads LIMIT 3`);
  await q('segments count',    `SELECT COUNT(*) AS cnt, record_type FROM CRMRMD.segments GROUP BY record_type`);
  await q('segments RWA',      `SELECT id, name_of_society, locality_name, depot_name FROM CRMRMD.segments WHERE record_type='RWA' LIMIT 3`);
  await q('users count',       `SELECT COUNT(*) AS cnt FROM CRMRMD.users`);
  await q('rmd_user_roles',    `SELECT COUNT(*) AS cnt FROM CRMRMD.rmd_user_roles LIMIT 1`);

  // Check if other databases exist
  const [dbs] = await conn.execute(`SHOW DATABASES`);
  for (const db of dbs) {
    const name = db.Database;
    if (!['information_schema','performance_schema','mysql','sys','CRMRMD'].includes(name)) {
      await q(`${name} TABLES`, `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='${name}'`);
    }
  }

  await conn.end();
})().catch(e => { console.error(e.message); process.exit(1); });
