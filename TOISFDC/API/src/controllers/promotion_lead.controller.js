const db = require('../config/database');

const CREATE_SQL = `
  CREATE TABLE IF NOT EXISTS CRMRMD.promotion_leads (
    id                     VARCHAR(36)   NOT NULL PRIMARY KEY,
    pln_number             VARCHAR(50)   DEFAULT NULL,
    promotion_lead_name    VARCHAR(255)  DEFAULT NULL,
    campaign_id            VARCHAR(36)   DEFAULT NULL,
    campaign_name          VARCHAR(255)  DEFAULT NULL,
    branch_code            VARCHAR(50)   DEFAULT NULL,
    sales_office           VARCHAR(100)  DEFAULT NULL,
    sales_group_code       VARCHAR(50)   DEFAULT NULL,
    prospect_name          VARCHAR(255)  DEFAULT NULL,
    address                TEXT          DEFAULT NULL,
    mobile_number          VARCHAR(20)   DEFAULT NULL,
    alternate_mobile_number VARCHAR(20)  DEFAULT NULL,
    landline_number        VARCHAR(20)   DEFAULT NULL,
    email                  VARCHAR(200)  DEFAULT NULL,
    pincode                VARCHAR(10)   DEFAULT NULL,
    dsa_code               VARCHAR(50)   DEFAULT NULL,
    depot_code             VARCHAR(50)   DEFAULT NULL,
    locality_code          VARCHAR(50)   DEFAULT NULL,
    dealer_code            VARCHAR(50)   DEFAULT NULL,
    vendor_code            VARCHAR(50)   DEFAULT NULL,
    source_of_data         VARCHAR(100)  DEFAULT NULL,
    is_bypass_validation   TINYINT(1)    DEFAULT 0,
    business_type          VARCHAR(100)  DEFAULT NULL,
    lead_source            VARCHAR(100)  DEFAULT NULL,
    owner_name             VARCHAR(200)  DEFAULT NULL,
    with_var               TINYINT(1)    DEFAULT 0,
    is_send_sms            TINYINT(1)    DEFAULT 0,
    sms_template_name      VARCHAR(200)  DEFAULT NULL,
    sms_var1               VARCHAR(500)  DEFAULT NULL,
    sms_var2               VARCHAR(500)  DEFAULT NULL,
    sms_var3               VARCHAR(500)  DEFAULT NULL,
    sms_var4               VARCHAR(500)  DEFAULT NULL,
    sms_var5               VARCHAR(500)  DEFAULT NULL,
    is_send_wa             TINYINT(1)    DEFAULT 0,
    whatsapp_template_name VARCHAR(200)  DEFAULT NULL,
    wa_var1                VARCHAR(500)  DEFAULT NULL,
    wa_var2                VARCHAR(500)  DEFAULT NULL,
    wa_var3                VARCHAR(500)  DEFAULT NULL,
    wa_var4                VARCHAR(500)  DEFAULT NULL,
    wa_var5                VARCHAR(500)  DEFAULT NULL,
    is_send_email          TINYINT(1)    DEFAULT 0,
    email_template_name    VARCHAR(200)  DEFAULT NULL,
    em_var1                VARCHAR(500)  DEFAULT NULL,
    em_var2                VARCHAR(500)  DEFAULT NULL,
    em_var3                VARCHAR(500)  DEFAULT NULL,
    em_var4                VARCHAR(500)  DEFAULT NULL,
    em_var5                VARCHAR(500)  DEFAULT NULL,
    status                 VARCHAR(50)   DEFAULT 'New',
    created_by             VARCHAR(100)  DEFAULT NULL,
    created_at             TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_campaign (campaign_id),
    INDEX idx_mobile  (mobile_number)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
`;

(async () => {
  try { await db.query(CREATE_SQL); }
  catch (e) { console.error('promotion_leads CREATE TABLE:', e.message); }
  console.log('promotion_leads table ready');
})();

// ── Helpers ───────────────────────────────────────────────────────────
function str(v) { const s = v?.toString().trim(); return s || null; }
function bool(v) { return (v === true || v === 1 || v === '1' || v === 'true' || v === 'Yes') ? 1 : 0; }

function generatePlnNumber() {
  return `PLN-${Math.floor(1000000 + Math.random() * 9000000)}`;
}

// Map CSV header → DB column
const CSV_MAP = {
  'branch code':            'branch_code',
  'sales office':           'sales_office',
  'sales group code':       'sales_group_code',
  'prospect name':          'prospect_name',
  'address':                'address',
  'mobile number':          'mobile_number',
  'landline number':        'landline_number',
  'dsa code':               'dsa_code',
  'depot code':             'depot_code',
  'locality code':          'locality_code',
  'dealer code':            'dealer_code',
  'vendor code':            'vendor_code',
  'email':                  'email',
  'pincode':                'pincode',
  'alternate mobile number':'alternate_mobile_number',
  'source of data':         'source_of_data',
  'is bypass validation':   'is_bypass_validation',
  'business type':          'business_type',
};

function buildData(body) {
  return {
    promotion_lead_name:    str(body.promotion_lead_name),
    campaign_id:            str(body.campaign_id),
    campaign_name:          str(body.campaign_name),
    branch_code:            str(body.branch_code),
    sales_office:           str(body.sales_office),
    sales_group_code:       str(body.sales_group_code),
    prospect_name:          str(body.prospect_name),
    address:                str(body.address),
    mobile_number:          str(body.mobile_number),
    alternate_mobile_number:str(body.alternate_mobile_number),
    landline_number:        str(body.landline_number),
    email:                  str(body.email),
    pincode:                str(body.pincode),
    dsa_code:               str(body.dsa_code),
    depot_code:             str(body.depot_code),
    locality_code:          str(body.locality_code),
    dealer_code:            str(body.dealer_code),
    vendor_code:            str(body.vendor_code),
    source_of_data:         str(body.source_of_data),
    is_bypass_validation:   bool(body.is_bypass_validation),
    business_type:          str(body.business_type),
    lead_source:            str(body.lead_source),
    owner_name:             str(body.owner_name),
    with_var:               bool(body.with_var),
    is_send_sms:            bool(body.is_send_sms),
    sms_template_name:      str(body.sms_template_name),
    sms_var1: str(body.sms_var1), sms_var2: str(body.sms_var2),
    sms_var3: str(body.sms_var3), sms_var4: str(body.sms_var4), sms_var5: str(body.sms_var5),
    is_send_wa:             bool(body.is_send_wa),
    whatsapp_template_name: str(body.whatsapp_template_name),
    wa_var1: str(body.wa_var1), wa_var2: str(body.wa_var2),
    wa_var3: str(body.wa_var3), wa_var4: str(body.wa_var4), wa_var5: str(body.wa_var5),
    is_send_email:          bool(body.is_send_email),
    email_template_name:    str(body.email_template_name),
    em_var1: str(body.em_var1), em_var2: str(body.em_var2),
    em_var3: str(body.em_var3), em_var4: str(body.em_var4), em_var5: str(body.em_var5),
    status:                 str(body.status) || 'New',
  };
}

// ── Route handlers ────────────────────────────────────────────────────

async function searchPromotionLeads(req, res) {
  const { q, campaign_id } = req.query;
  try {
    let sql, params;
    if (campaign_id) {
      const sw = q?.trim() ? `%${q.trim()}%` : null;
      if (sw) {
        sql = `SELECT * FROM CRMRMD.promotion_leads WHERE campaign_id=? AND (prospect_name LIKE ? OR mobile_number LIKE ? OR pln_number LIKE ?) ORDER BY created_at DESC LIMIT 50`;
        params = [campaign_id, sw, sw, sw];
      } else {
        sql = `SELECT * FROM CRMRMD.promotion_leads WHERE campaign_id=? ORDER BY created_at DESC LIMIT 50`;
        params = [campaign_id];
      }
    } else if (q?.trim()) {
      const sw = `%${q.trim()}%`;
      sql = `SELECT * FROM CRMRMD.promotion_leads WHERE prospect_name LIKE ? OR mobile_number LIKE ? OR pln_number LIKE ? OR promotion_lead_name LIKE ? ORDER BY created_at DESC LIMIT 50`;
      params = [sw, sw, sw, sw];
    } else {
      sql = `SELECT * FROM CRMRMD.promotion_leads ORDER BY created_at DESC LIMIT 20`;
      params = [];
    }
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('searchPromotionLeads:', e);
    res.status(500).json({ error: e.message });
  }
}

async function getById(req, res) {
  try {
    const [rows] = await db.query(`SELECT * FROM CRMRMD.promotion_leads WHERE id=?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createPromotionLead(req, res) {
  try {
    const id   = crypto.randomUUID();
    const data = { id, pln_number: generatePlnNumber(), ...buildData(req.body), created_by: req.userId || null };
    const cols = Object.keys(data).join(', ');
    const ph   = Object.keys(data).map(() => '?').join(', ');
    await db.query(`INSERT INTO CRMRMD.promotion_leads (${cols}) VALUES (${ph})`, Object.values(data));
    res.json({ success: true, id, pln_number: data.pln_number });
  } catch (e) {
    console.error('createPromotionLead:', e);
    res.status(500).json({ error: e.message });
  }
}

async function updatePromotionLead(req, res) {
  try {
    const data = buildData(req.body);
    const sets = Object.keys(data).map(k => `${k}=?`).join(', ');
    await db.query(`UPDATE CRMRMD.promotion_leads SET ${sets} WHERE id=?`, [...Object.values(data), req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error('updatePromotionLead:', e);
    res.status(500).json({ error: e.message });
  }
}

// Bulk insert from CSV upload (body.records = array of objects from client-parsed CSV)
async function bulkInsert(req, res) {
  const { records, campaign_id, campaign_name } = req.body;
  if (!Array.isArray(records) || records.length === 0)
    return res.status(400).json({ error: 'No records provided' });

  let inserted = 0;
  const errors = [];
  for (const raw of records) {
    // Map CSV headers to DB columns
    const mapped = {};
    for (const [csvKey, dbCol] of Object.entries(CSV_MAP)) {
      const val = raw[csvKey] || raw[dbCol] || raw[csvKey.replace(/ /g, '_')] || '';
      mapped[dbCol] = val || null;
    }
    if (campaign_id) { mapped.campaign_id = campaign_id; }
    if (campaign_name) { mapped.campaign_name = campaign_name; }
    mapped.status = 'New';

    try {
      const id  = crypto.randomUUID();
      const row = { id, pln_number: generatePlnNumber(), ...mapped, created_by: req.userId || null };
      const cols = Object.keys(row).join(', ');
      const ph   = Object.keys(row).map(() => '?').join(', ');
      await db.query(`INSERT INTO CRMRMD.promotion_leads (${cols}) VALUES (${ph})`, Object.values(row));
      inserted++;
    } catch (e) {
      errors.push(e.message);
    }
  }
  res.json({ success: true, inserted, errors: errors.length ? errors.slice(0, 5) : undefined });
}

// Download sample CSV header row
async function sampleCsv(req, res) {
  const header = 'Branch Code,Sales Office,Sales Group Code,Prospect Name,Address,Mobile Number,Landline Number,DSA Code,Depot Code,Locality Code,Dealer Code,Vendor Code,Email,Pincode,Alternate Mobile Number,Source Of Data,Is Bypass Validation,Business Type';
  const sample = 'BLR001,South Office,SG01,John Doe,123 Main St,9876543210,080-12345678,DSA001,DEPOT001,LOC001,DLR001,VND001,john@example.com,560001,9876543211,Online,No,Newspaper';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="promotion_leads_sample.csv"');
  res.send(`${header}\n${sample}\n`);
}

module.exports = { searchPromotionLeads, getById, createPromotionLead, updatePromotionLead, bulkInsert, sampleCsv };
