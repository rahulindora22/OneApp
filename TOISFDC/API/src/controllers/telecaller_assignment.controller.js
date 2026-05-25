const db = require('../config/database');

const CREATE_SQL = `
  CREATE TABLE IF NOT EXISTS CRMRMD.telecaller_assignments (
    id               VARCHAR(36)  NOT NULL PRIMARY KEY,
    tan_number       VARCHAR(20)  DEFAULT NULL,
    assignment_name  VARCHAR(255) DEFAULT NULL,
    campaign_id      VARCHAR(36)  DEFAULT NULL,
    campaign_name    VARCHAR(255) DEFAULT NULL,
    telecaller_id    VARCHAR(36)  DEFAULT NULL,
    telecaller_name  VARCHAR(255) DEFAULT NULL,
    is_active        TINYINT(1)   DEFAULT 0,
    owner_name       VARCHAR(200) DEFAULT NULL,
    message          TEXT         DEFAULT NULL,
    sync_status      VARCHAR(50)  DEFAULT NULL,
    created_by       VARCHAR(100) DEFAULT NULL,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_campaign   (campaign_id),
    INDEX idx_telecaller (telecaller_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
`;

(async () => {
  try { await db.query(CREATE_SQL); }
  catch (e) { console.error('telecaller_assignments CREATE TABLE:', e.message); }
  console.log('telecaller_assignments table ready');
})();

// ── Helpers ───────────────────────────────────────────────────────────
function str(v) { const s = v?.toString().trim(); return s || null; }
function bool(v) { return (v === true || v === 1 || v === '1' || v === 'true') ? 1 : 0; }

async function generateTanNumber() {
  const [rows] = await db.query(
    `SELECT tan_number FROM CRMRMD.telecaller_assignments WHERE tan_number IS NOT NULL ORDER BY created_at DESC LIMIT 1`
  );
  if (rows.length && rows[0].tan_number) {
    const last = parseInt(rows[0].tan_number.replace('TAN-', ''), 10) || 0;
    return `TAN-${String(last + 1).padStart(5, '0')}`;
  }
  return 'TAN-00001';
}

function buildData(body) {
  return {
    assignment_name: str(body.assignment_name),
    campaign_id:     str(body.campaign_id),
    campaign_name:   str(body.campaign_name),
    telecaller_id:   str(body.telecaller_id),
    telecaller_name: str(body.telecaller_name),
    is_active:       bool(body.is_active),
    owner_name:      str(body.owner_name),
    message:         str(body.message),
    sync_status:     str(body.sync_status),
  };
}

// ── Search users for telecaller lookup ────────────────────────────────
async function searchUsers(req, res) {
  const { q } = req.query;
  try {
    const sw = q?.trim() ? `%${q.trim()}%` : '%';
    const [rows] = await db.query(
      `SELECT id, name, email, rmd_bp_id, employee_number, rmd_is_dsa, rmd_is_tc, rmd_is_tcs
         FROM CRMRMD.users
        WHERE is_active = 1
          AND (name LIKE ? OR rmd_bp_id LIKE ? OR employee_number LIKE ? OR email LIKE ?)
        ORDER BY name
        LIMIT 30`,
      [sw, sw, sw, sw]
    );
    // Display label: "NAME DSA_CODE" or just name
    const result = rows.map(u => ({
      id:           u.id,
      name:         u.name,
      rmd_bp_id:    u.rmd_bp_id,
      display_name: u.rmd_bp_id ? `${u.name} ${u.rmd_bp_id}` : u.name,
      email:        u.email,
    }));
    res.json(result);
  } catch (e) {
    console.error('searchUsers:', e);
    res.status(500).json({ error: e.message });
  }
}

// ── CRUD handlers ─────────────────────────────────────────────────────
async function searchAssignments(req, res) {
  const { q, campaign_id } = req.query;
  try {
    let sql, params;
    if (campaign_id) {
      const sw = q?.trim() ? `%${q.trim()}%` : null;
      if (sw) {
        sql = `SELECT * FROM CRMRMD.telecaller_assignments WHERE campaign_id=? AND (assignment_name LIKE ? OR telecaller_name LIKE ? OR tan_number LIKE ?) ORDER BY created_at DESC LIMIT 50`;
        params = [campaign_id, sw, sw, sw];
      } else {
        sql = `SELECT * FROM CRMRMD.telecaller_assignments WHERE campaign_id=? ORDER BY created_at DESC`;
        params = [campaign_id];
      }
    } else {
      const sw = q?.trim() ? `%${q.trim()}%` : '%';
      sql = `SELECT * FROM CRMRMD.telecaller_assignments WHERE assignment_name LIKE ? OR telecaller_name LIKE ? OR tan_number LIKE ? ORDER BY created_at DESC LIMIT 50`;
      params = [sw, sw, sw];
    }
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('searchAssignments:', e);
    res.status(500).json({ error: e.message });
  }
}

async function getById(req, res) {
  try {
    const [rows] = await db.query(`SELECT * FROM CRMRMD.telecaller_assignments WHERE id=?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createAssignment(req, res) {
  try {
    const id  = crypto.randomUUID();
    const tan = await generateTanNumber();
    const data = { id, tan_number: tan, ...buildData(req.body), created_by: req.userId || null };
    const cols = Object.keys(data).join(', ');
    const ph   = Object.keys(data).map(() => '?').join(', ');
    await db.query(`INSERT INTO CRMRMD.telecaller_assignments (${cols}) VALUES (${ph})`, Object.values(data));
    res.json({ success: true, id, tan_number: tan });
  } catch (e) {
    console.error('createAssignment:', e);
    res.status(500).json({ error: e.message });
  }
}

async function updateAssignment(req, res) {
  try {
    const data = buildData(req.body);
    const sets = Object.keys(data).map(k => `${k}=?`).join(', ');
    await db.query(`UPDATE CRMRMD.telecaller_assignments SET ${sets} WHERE id=?`, [...Object.values(data), req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error('updateAssignment:', e);
    res.status(500).json({ error: e.message });
  }
}

module.exports = { searchAssignments, getById, createAssignment, updateAssignment, searchUsers };
