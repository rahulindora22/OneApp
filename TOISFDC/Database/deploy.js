const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

const HOST     = 'moh-poc-ai.cvyeg34elr4s.ap-south-1.rds.amazonaws.com';
const PORT     = 3306;
const USER     = 'admin';
const PASSWORD = 'BCCLpassword123';
const DB_NAME  = 'OneApp';
const SSL_OPTS = { rejectUnauthorized: false };

const SQL_FILE = path.join(__dirname, '..', 'API', 'schema.sql');

async function connect(database) {
  return mysql.createConnection({
    host: HOST, port: PORT, user: USER, password: PASSWORD,
    ...(database ? { database } : {}),
    multipleStatements: false,
    ssl: SSL_OPTS,
  });
}

async function deploy() {
  // ── Step 1: create the database ──────────────────────────────────
  console.log('Connecting (no DB) …');
  let conn = await connect(null);
  console.log('Connected.');

  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  console.log(`Database '${DB_NAME}' ready.`);
  await conn.end();

  // ── Step 2: reconnect with the database ──────────────────────────
  console.log(`Reconnecting to ${DB_NAME} …`);
  conn = await connect(DB_NAME);
  console.log('Connected.\n');

  // ── Step 3: build statement list (skip CREATE DATABASE / USE) ────
  const raw = fs.readFileSync(SQL_FILE, 'utf8');

  // Strip full-line comments, then split on semicolons
  const stripped = raw
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  const statements = stripped
    .split(';')
    .map(s => s.trim())
    .filter(s =>
      s.length > 0 &&
      !/^CREATE DATABASE/i.test(s) &&
      !/^USE\s/i.test(s)
    );

  let ok = 0, skipped = 0;
  for (const stmt of statements) {
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 90);
    try {
      await conn.query(stmt);
      console.log(`  ✓  ${preview}${stmt.length > 90 ? '…' : ''}`);
      ok++;
    } catch (err) {
      if (['ER_TABLE_EXISTS_ERROR', 'ER_DUP_ENTRY', 'ER_DUP_KEYNAME'].includes(err.code)) {
        console.log(`  ⓘ  Already exists – ${preview.slice(0, 60)}…`);
        skipped++;
      } else {
        console.error(`  ✗  ${err.message}`);
        console.error(`     SQL: ${stmt.slice(0, 120)}`);
      }
    }
  }

  await conn.end();
  console.log(`\n✅  Done.  ${ok} statements executed, ${skipped} already existed.`);
}

deploy().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
