require('dotenv').config();
const mysql = require('mysql2/promise');

// ── Depot territories to create (all under RMD-MUMBAI, territory_id=43) ──
const DEPOTS = [
  { code: 'MU-DUMMY-UPC',  name: 'DUMMY DEPO-UPC'        },
  { code: 'MU-DSP-TC-01',  name: 'DSP Thakur Complex 1'  },
  { code: 'MU-DSP-TC-02',  name: 'DSP Thakur Complex 2'  },
  { code: 'MU-DSP-TC-03',  name: 'DSP Thakur Complex 3'  },
  { code: 'MU-DSP-TC-04',  name: 'DSP Thakur Complex 4'  },
  { code: 'MU-DSP-TC-05',  name: 'DSP Thakur Complex 5'  },
  { code: 'MU-DSP-TC-06',  name: 'DSP Thakur Complex 6'  },
  { code: 'MU-DSP-TC-07',  name: 'DSP Thakur Complex 7'  },
  { code: 'MU-DSP-TC-08',  name: 'DSP Thakur Complex 8'  },
  { code: 'MU-DSP-TC-09',  name: 'DSP Thakur Complex 9'  },
];

const MUMBAI_BRANCH_ID = 43;   // territory_id of RMD-MUMBAI
const MUMBAI_CODE      = 'BRANCH-0400';

// ── User role assignments ─────────────────────────────────────────────────
// territory name → { userId, userName, type }
const ROLE_MAP = {
  'DUMMY DEPO-UPC':       { userId: '057eb288-743e-4698-b44d-cc04a9741809', userName: 'Rahul Indora', type: 'ADSA' },
  'DSP Thakur Complex 1': { userId: '057eb288-743e-4698-b44d-cc04a9741809', userName: 'Rahul Indora', type: 'DSA'  },
  'DSP Thakur Complex 2': { userId: '057eb288-743e-4698-b44d-cc04a9741809', userName: 'Rahul Indora', type: 'DSA'  },
  'DSP Thakur Complex 3': { userId: '057eb288-743e-4698-b44d-cc04a9741809', userName: 'Rahul Indora', type: 'DSA'  },
  'DSP Thakur Complex 4': { userId: '057eb288-743e-4698-b44d-cc04a9741809', userName: 'Rahul Indora', type: 'DSA'  },
  'DSP Thakur Complex 5': { userId: '8f9fe56a-fc1c-4d17-834f-5f14d238bfa5', userName: 'Kiran Madde',  type: 'DSA'  },
  'DSP Thakur Complex 6': { userId: '8f9fe56a-fc1c-4d17-834f-5f14d238bfa5', userName: 'Kiran Madde',  type: 'DSA'  },
  'DSP Thakur Complex 7': { userId: '8f9fe56a-fc1c-4d17-834f-5f14d238bfa5', userName: 'Kiran Madde',  type: 'DSA'  },
  'DSP Thakur Complex 8': { userId: '8f9fe56a-fc1c-4d17-834f-5f14d238bfa5', userName: 'Kiran Madde',  type: 'DSA'  },
  'DSP Thakur Complex 9': { userId: '8f9fe56a-fc1c-4d17-834f-5f14d238bfa5', userName: 'Kiran Madde',  type: 'DSA'  },
};

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    timezone: '+05:30',
  });

  // ── Step 1: Verify users exist ────────────────────────────────────────
  console.log('── Verifying users ──────────────────────────────────');
  const userIds = [...new Set(Object.values(ROLE_MAP).map(r => r.userId))];
  const uPlaceholders = userIds.map(() => '?').join(',');
  const [users] = await conn.execute(
    `SELECT id, name FROM CRMRMD.users WHERE id IN (${uPlaceholders})`, userIds
  );
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
  for (const uid of userIds) {
    if (userMap[uid]) console.log(`  ✓ Found: ${userMap[uid]} (${uid})`);
    else              console.error(`  ✗ Missing user: ${uid}`);
  }

  // ── Step 2: Insert depot territories under RMD-MUMBAI ─────────────────
  console.log('\n── Creating depot territories (parent: RMD-MUMBAI / id=43) ──');
  const territoryIdMap = {}; // name → territory_id

  for (const depot of DEPOTS) {
    // Check if already exists
    const [existing] = await conn.execute(
      'SELECT territory_id FROM CRMRMD.territory WHERE territory_name = ? LIMIT 1',
      [depot.name]
    );
    if (existing.length > 0) {
      territoryIdMap[depot.name] = existing[0].territory_id;
      console.log(`  SKIP (exists) [id=${existing[0].territory_id}]  ${depot.name}`);
      continue;
    }

    const [res] = await conn.execute(
      `INSERT INTO CRMRMD.territory
         (territory_code, territory_name, territory_type,
          parent_territory_id, branch_id, is_active)
       VALUES (?, ?, 'DEPOT', ?, ?, 1)`,
      [depot.code, depot.name, String(MUMBAI_BRANCH_ID), MUMBAI_CODE]
    );
    territoryIdMap[depot.name] = res.insertId;
    console.log(`  INSERT [id=${res.insertId}]  ${depot.name}  (code: ${depot.code})`);
  }

  // ── Step 3: Build next user-role name sequence ─────────────────────────
  async function nextRoleName() {
    const [[row]] = await conn.execute(
      "SELECT MAX(CAST(SUBSTRING(name, 4) AS UNSIGNED)) AS mx FROM CRMRMD.user_roles WHERE name LIKE 'UR-%'"
    );
    const next = (row.mx || 0) + 1;
    return `UR-${String(next).padStart(6, '0')}`;
  }

  // ── Step 4: Create user roles ──────────────────────────────────────────
  console.log('\n── Creating user roles ──────────────────────────────');
  let inserted = 0, skipped = 0, errors = 0;

  for (const [depotName, role] of Object.entries(ROLE_MAP)) {
    const territoryId = territoryIdMap[depotName];
    if (!territoryId) {
      console.error(`  ✗ No territory_id for: ${depotName}`);
      errors++;
      continue;
    }

    // Skip if identical role already exists
    const [exists] = await conn.execute(
      'SELECT id FROM CRMRMD.user_roles WHERE user_id=? AND territory_id=? AND type=? LIMIT 1',
      [role.userId, territoryId, role.type]
    );
    if (exists.length > 0) {
      console.log(`  SKIP (exists)  ${role.type.padEnd(5)}  ${role.userName.padEnd(15)}  → ${depotName}`);
      skipped++;
      continue;
    }

    try {
      const name = await nextRoleName();
      await conn.execute(
        `INSERT INTO CRMRMD.user_roles
           (name, user_id, territory_id, type, is_active, is_primary_role)
         VALUES (?, ?, ?, ?, 1, 0)`,
        [name, role.userId, territoryId, role.type]
      );
      console.log(`  INSERT [${name}]  ${role.type.padEnd(5)}  ${role.userName.padEnd(15)}  → ${depotName}`);
      inserted++;
    } catch (e) {
      console.error(`  ✗ Error for ${depotName}: ${e.message}`);
      errors++;
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────
  console.log('\n── Summary ──────────────────────────────────────────');
  console.log(`  Territories created : ${Object.values(territoryIdMap).length}`);
  console.log(`  User roles inserted : ${inserted}`);
  console.log(`  User roles skipped  : ${skipped}`);
  console.log(`  Errors              : ${errors}`);

  // ── Final verification ────────────────────────────────────────────────
  console.log('\n── Final check: user roles created ─────────────────');
  const [roles] = await conn.execute(
    `SELECT ur.name, u.name AS user_name, t.territory_name, ur.type, ur.is_active
     FROM CRMRMD.user_roles ur
     JOIN CRMRMD.users u     ON ur.user_id = u.id
     JOIN CRMRMD.territory t ON ur.territory_id = t.territory_id
     WHERE t.parent_territory_id = ?
     ORDER BY u.name, t.territory_name`,
    [String(MUMBAI_BRANCH_ID)]
  );
  roles.forEach(r =>
    console.log(`  ${r.name}  ${r.type.padEnd(5)}  ${r.user_name.padEnd(15)}  → ${r.territory_name}`)
  );

  await conn.end();
})().catch(e => { console.error(e.message); process.exit(1); });
