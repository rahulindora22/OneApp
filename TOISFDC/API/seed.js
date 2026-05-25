/**
 * Seed script — inserts test users, a branch, a territory, and user roles
 * into the OneApp database so the mobile app can be tested end-to-end.
 *
 * Run once:  node seed.js
 */
require('dotenv').config();
const mysql    = require('mysql2/promise');
const bcrypt   = require('bcryptjs');

const DB = {
  host    : process.env.DB_HOST,
  port    : process.env.DB_PORT || 3306,
  user    : process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl     : { rejectUnauthorized: false },
};

// ── Users to seed ────────────────────────────────────────────────────────────
const USERS = [
  { name: 'Mahesh Dubey',  email: 'Mahesh.dubey@timesofindia.com', password: 'Admin@123',  type: 'SM'  },
  { name: 'Test SM User',  email: 'sm@timesofindia.com',           password: 'Test@1234',  type: 'SM'  },
  { name: 'Test ASM User', email: 'asm@timesofindia.com',          password: 'Test@1234',  type: 'ASM' },
  { name: 'Test TSE User', email: 'tse@timesofindia.com',          password: 'Test@1234',  type: 'TSE' },
];

async function seed() {
  const conn = await mysql.createConnection(DB);
  console.log('Connected to', process.env.DB_NAME, '\n');

  // ── 1. Branch ─────────────────────────────────────────────────────────────
  const branchId = 'branch-mumbai-001';
  await conn.query(`
    INSERT IGNORE INTO rmd_branch (id, name)
    VALUES (?, 'Mumbai Branch')
  `, [branchId]);
  console.log('✓  Branch: Mumbai Branch');

  // ── 2. Locality ───────────────────────────────────────────────────────────
  const localityId = 'locality-andheri-001';
  await conn.query(`
    INSERT IGNORE INTO localities (id, name)
    VALUES (?, 'Andheri West')
  `, [localityId]);
  console.log('✓  Locality: Andheri West');

  // ── 3. Territory (Depot) ──────────────────────────────────────────────────
  const depotId = 'depot-andheri-001';
  await conn.query(`
    INSERT IGNORE INTO rmd_territory_master
      (id, name, rmd_sap_code, rmd_territory_type, rmd_branch_id,
       depo_geolocation_lat, depo_geolocation_lng)
    VALUES (?, 'Andheri Depot', 'SAP001', 'DEPOT', ?,
            19.1197, 72.8468)
  `, [depotId, branchId]);
  console.log('✓  Depot: Andheri Depot');

  // ── 4. Sample Segments (1 RWA, 1 CSP, 1 OOH) ─────────────────────────────
  const segments = [
    { id: 'seg-rwa-001', record_type: 'RWA', name: 'Lokhandwala Complex',
      name_of_society: 'Lokhandwala Complex', slab: 'A', category: 'Premium',
      city: 'Mumbai', total_flats: 500, occupied_flats: 480,
      pending_approval_lat: 19.1350, pending_approval_lng: 72.8270 },
    { id: 'seg-csp-001', record_type: 'CSP', name: 'Andheri Kirana Store',
      name_of_society: 'Andheri Kirana Store', premiumness: 'High',
      category: 'Retail', city: 'Mumbai',
      pending_approval_lat: 19.1197, pending_approval_lng: 72.8468 },
    { id: 'seg-ooh-001', record_type: 'OOH', name: 'Andheri Bus Stop Hoarding',
      sub_category: 'Hoarding', ooh_type: 'Static', measure_of_potential: 5000,
      potential_count: 10000, premium_status: 'Premium', city: 'Mumbai',
      pending_approval_lat: 19.1200, pending_approval_lng: 72.8470 },
  ];

  for (const s of segments) {
    await conn.query(`
      INSERT IGNORE INTO segments
        (id, name, record_type, name_of_society, slab, category, sub_category,
         ooh_type, measure_of_potential, potential_count, premiumness,
         premium_status, city, total_flats, occupied_flats,
         pending_approval_lat, pending_approval_lng,
         locality_id, depot_id, segment_branch_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      s.id, s.name, s.record_type, s.name_of_society ?? null,
      s.slab ?? null, s.category ?? null, s.sub_category ?? null,
      s.ooh_type ?? null, s.measure_of_potential ?? null, s.potential_count ?? null,
      s.premiumness ?? null, s.premium_status ?? null, s.city ?? null,
      s.total_flats ?? null, s.occupied_flats ?? null,
      s.pending_approval_lat, s.pending_approval_lng,
      localityId, depotId, branchId,
    ]);
    console.log(`✓  Segment [${s.record_type}]: ${s.name}`);
  }

  // ── 5. Users + User Roles ─────────────────────────────────────────────────
  console.log('');
  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    const userId = `user-${u.email.split('@')[0].toLowerCase().replace(/\./g, '-')}`;

    await conn.query(`
      INSERT IGNORE INTO users (id, name, email, password_hash)
      VALUES (?, ?, ?, ?)
    `, [userId, u.name, u.email, hash]);

    // Assign user to Andheri Depot with their role type
    await conn.query(`
      INSERT IGNORE INTO rmd_user_roles
        (id, rmd_territory_master_id, rmd_user_id, rmd_territory_type, rmd_type)
      VALUES (?, ?, ?, 'DEPOT', ?)
    `, [`role-${userId}`, depotId, userId, u.type]);

    console.log(`✓  User: ${u.name} (${u.email})  password: ${u.password}  role: ${u.type}`);
  }

  await conn.end();
  console.log('\n✅  Seed complete. Use the credentials above to log in.\n');
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
