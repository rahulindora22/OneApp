const db = require('../config/database');

const USER_ROLE_TYPES = [
  'ADSA', 'DEO', 'DEOS', 'DSA', 'TC', 'TCS', 'SalesEx', 'DSPS', 'BO',
  'Group Head', 'Regional Manager', 'City Head', 'Branch Head',
  'Zonal Manager', 'DRE', 'Beam Team',
];

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS CRMRMD.user_roles (
    id               VARCHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
    name             VARCHAR(20)      NOT NULL,
    user_id          VARCHAR(36)      NOT NULL,
    territory_id     INT UNSIGNED     NOT NULL,
    type             VARCHAR(50)      NOT NULL,
    is_active        TINYINT(1)       NOT NULL DEFAULT 1,
    is_primary_role  TINYINT(1)       NOT NULL DEFAULT 0,
    manager_id       VARCHAR(36)      NULL,
    manager_role_id  VARCHAR(36)      NULL,
    business_partner_id VARCHAR(36)   NULL,
    created_by       VARCHAR(36)      NULL,
    created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_user_id     (user_id),
    KEY idx_territory   (territory_id),
    KEY idx_active      (is_active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
`;

(async () => {
  try {
    await db.query(CREATE_TABLE_SQL);
    console.log('user_roles table ready');
  } catch (e) {
    console.error('user_roles table init error:', e.message);
  }
})();

async function _nextName() {
  const [[row]] = await db.query(
    "SELECT MAX(CAST(SUBSTRING(name, 4) AS UNSIGNED)) AS mx FROM CRMRMD.user_roles WHERE name LIKE 'UR-%'"
  );
  const next = (row.mx || 0) + 1;
  return `UR-${String(next).padStart(6, '0')}`;
}

// ── GET /api/user-roles ───────────────────────────────────────────
async function list(req, res) {
  try {
    const { q, user_id, type, is_active, territory_id } = req.query;
    const conditions = [];
    const params = [];

    if (user_id) { conditions.push('ur.user_id = ?'); params.push(user_id); }
    if (type)    { conditions.push('ur.type = ?');    params.push(type); }
    if (is_active !== undefined) { conditions.push('ur.is_active = ?'); params.push(is_active === 'true' || is_active === '1' ? 1 : 0); }
    if (territory_id) { conditions.push('ur.territory_id = ?'); params.push(territory_id); }
    if (q) {
      conditions.push('(u.name LIKE ? OR t.territory_name LIKE ? OR ur.name LIKE ?)');
      const sw = `%${q}%`;
      params.push(sw, sw, sw);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows] = await db.query(
      `SELECT ur.id, ur.name, ur.user_id, ur.territory_id, ur.type,
              ur.is_active, ur.is_primary_role,
              ur.manager_id, ur.manager_role_id, ur.business_partner_id,
              ur.created_by, ur.created_at, ur.updated_at,
              u.name AS user_name, u.email AS user_email,
              t.territory_name, t.territory_code, t.territory_type, t.branch_id,
              mu.name AS manager_name
       FROM CRMRMD.user_roles ur
       JOIN CRMRMD.users u       ON ur.user_id = u.id
       JOIN CRMRMD.territory t   ON ur.territory_id = t.territory_id
       LEFT JOIN CRMRMD.users mu ON ur.manager_id = mu.id
       ${where}
       ORDER BY ur.created_at DESC
       LIMIT 200`,
      params
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── GET /api/user-roles/types ─────────────────────────────────────
async function getTypes(req, res) {
  res.json(USER_ROLE_TYPES);
}

// ── GET /api/user-roles/:id ───────────────────────────────────────
async function getById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT ur.id, ur.name, ur.user_id, ur.territory_id, ur.type,
              ur.is_active, ur.is_primary_role,
              ur.manager_id, ur.manager_role_id, ur.business_partner_id,
              ur.created_by, ur.created_at, ur.updated_at,
              u.name AS user_name, u.email AS user_email,
              t.territory_name, t.territory_code, t.territory_type, t.branch_id
       FROM CRMRMD.user_roles ur
       JOIN CRMRMD.users u     ON ur.user_id = u.id
       JOIN CRMRMD.territory t ON ur.territory_id = t.territory_id
       WHERE ur.id = ?
       LIMIT 1`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── POST /api/user-roles ──────────────────────────────────────────
async function create(req, res) {
  try {
    const { user_id, territory_id, type, is_active = 1, is_primary_role = 0,
            manager_id, manager_role_id, business_partner_id } = req.body;

    if (!user_id || !territory_id || !type) {
      return res.status(400).json({ error: 'user_id, territory_id, and type are required' });
    }
    if (!USER_ROLE_TYPES.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Allowed: ${USER_ROLE_TYPES.join(', ')}` });
    }

    const name = await _nextName();
    await db.query(
      `INSERT INTO CRMRMD.user_roles
         (name, user_id, territory_id, type, is_active, is_primary_role,
          manager_id, manager_role_id, business_partner_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, user_id, territory_id, type, is_active ? 1 : 0, is_primary_role ? 1 : 0,
       manager_id || null, manager_role_id || null, business_partner_id || null, req.userId]
    );
    const [[created]] = await db.query(
      'SELECT * FROM CRMRMD.user_roles WHERE name = ? LIMIT 1', [name]
    );
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── PUT /api/user-roles/:id ───────────────────────────────────────
async function update(req, res) {
  try {
    const { id } = req.params;
    const { user_id, territory_id, type, is_active, is_primary_role,
            manager_id, manager_role_id, business_partner_id } = req.body;

    if (type && !USER_ROLE_TYPES.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Allowed: ${USER_ROLE_TYPES.join(', ')}` });
    }

    const fields = [];
    const params = [];
    if (user_id !== undefined)            { fields.push('user_id = ?');            params.push(user_id); }
    if (territory_id !== undefined)       { fields.push('territory_id = ?');       params.push(territory_id); }
    if (type !== undefined)               { fields.push('type = ?');               params.push(type); }
    if (is_active !== undefined)          { fields.push('is_active = ?');          params.push(is_active ? 1 : 0); }
    if (is_primary_role !== undefined)    { fields.push('is_primary_role = ?');    params.push(is_primary_role ? 1 : 0); }
    if (manager_id !== undefined)         { fields.push('manager_id = ?');         params.push(manager_id || null); }
    if (manager_role_id !== undefined)    { fields.push('manager_role_id = ?');    params.push(manager_role_id || null); }
    if (business_partner_id !== undefined){ fields.push('business_partner_id = ?'); params.push(business_partner_id || null); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(id);

    await db.query(`UPDATE CRMRMD.user_roles SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── GET /api/user-roles/search-users ─────────────────────────────
async function searchUsers(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const sw = `%${q}%`;
    const [rows] = await db.query(
      `SELECT id, name, email, username FROM CRMRMD.users
       WHERE is_active = 1 AND (name LIKE ? OR email LIKE ? OR username LIKE ?)
       ORDER BY name LIMIT 20`,
      [sw, sw, sw]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── GET /api/user-roles/search-territories ────────────────────────
async function searchTerritories(req, res) {
  try {
    const { q, type } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const sw = `%${q}%`;
    const params = [sw];
    let typeFilter = '';
    if (type) { typeFilter = ' AND territory_type = ?'; params.push(type); }
    const [rows] = await db.query(
      `SELECT territory_id, territory_code, territory_name, territory_type, branch_id, zone
       FROM CRMRMD.territory
       WHERE is_active = 1 AND (territory_name LIKE ? OR territory_code LIKE ?)${typeFilter}
       ORDER BY territory_name LIMIT 20`,
      [...params, sw]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { list, getTypes, getById, create, update, searchUsers, searchTerritories };
