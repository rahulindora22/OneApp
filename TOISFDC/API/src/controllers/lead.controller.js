const db = require('../config/database');

/* Table is created via migrations/create_leads_table.sql
   Run that script once in MySQL Workbench before starting the server. */

const CREATE_SQL = `
  CREATE TABLE IF NOT EXISTS CRMRMD.leads (
    id                       VARCHAR(36)  NOT NULL PRIMARY KEY,
    record_type              VARCHAR(100) DEFAULT 'Household Fresh',
    salutation               VARCHAR(20),
    first_name               VARCHAR(100),
    last_name                VARCHAR(100) NOT NULL,
    title                    VARCHAR(100),
    gender                   VARCHAR(20),
    birth_date               DATE,
    age                      INT,
    age_group                VARCHAR(50),
    education                VARCHAR(100),
    occupation               VARCHAR(100),
    income_range             VARCHAR(50),
    no_of_children           TINYINT DEFAULT 0,
    phone                    VARCHAR(20),
    mobile                   VARCHAR(20),
    alternate_mobile         VARCHAR(20),
    alternate_mobile2        VARCHAR(20),
    email                    VARCHAR(200),
    alternate_email          VARCHAR(200),
    sms_mobile               VARCHAR(20),
    house_no                 VARCHAR(50),
    floor_no                 VARCHAR(50),
    building_wing_tower      VARCHAR(100),
    society_apartment_name   VARCHAR(200),
    society_name             VARCHAR(200),
    street_colony_road       VARCHAR(200),
    landmark                 VARCHAR(200),
    pocket_block             VARCHAR(100),
    locality_name            VARCHAR(200),
    locality_code            VARCHAR(50),
    pincode                  VARCHAR(10),
    city                     VARCHAR(100),
    district                 VARCHAR(100),
    state                    VARCHAR(100),
    address                  TEXT,
    rmd_address              TEXT,
    company                  VARCHAR(200),
    industry                 VARCHAR(100),
    rating                   VARCHAR(20),
    website                  VARCHAR(255),
    vertical                 VARCHAR(50),
    order_type               VARCHAR(50),
    lead_status              VARCHAR(50) DEFAULT 'New',
    lead_source              VARCHAR(50),
    call_status              VARCHAR(50),
    visit_status             VARCHAR(50),
    interested               VARCHAR(10),
    primary_contact          VARCHAR(50),
    pre_prospect_record_type VARCHAR(100),
    publications             VARCHAR(200),
    branch_code              VARCHAR(20),
    depot_code               VARCHAR(20),
    crm_email                VARCHAR(200),
    owner_name               VARCHAR(200),
    payee_name               VARCHAR(200),
    agree_terms              TINYINT(1) DEFAULT 0,
    opt_in                   TINYINT(1) DEFAULT 0,
    is_converted             TINYINT(1) DEFAULT 0,
    is_duplicate             TINYINT(1) DEFAULT 0,
    is_institutional         TINYINT(1) DEFAULT 0,
    is_serviceable           TINYINT(1) DEFAULT 0,
    fresh_payment_flag       TINYINT(1) DEFAULT 0,
    next_action_datetime     DATETIME,
    next_action_remarks      TEXT,
    appointment_datetime     DATETIME,
    interested_on_date       DATE,
    offer_valid_date         DATE,
    order_expiry_date        DATE,
    reason                   VARCHAR(200),
    interest                 VARCHAR(100),
    competition              VARCHAR(100),
    reason_for_lost          VARCHAR(200),
    renewal_payment_link     VARCHAR(500),
    short_renewal_payment_link VARCHAR(200),
    measure_of_potential     VARCHAR(100),
    number_of_copies         INT DEFAULT 0,
    period_of_contract       VARCHAR(50),
    potential_count          INT DEFAULT 0,
    type_of_model            VARCHAR(50),
    industry_type            VARCHAR(100),
    industry_sub_category    VARCHAR(100),
    day_of_delivery          VARCHAR(50),
    final_scheme_count       INT DEFAULT 0,
    toi  INT DEFAULT 0,
    et   INT DEFAULT 0,
    etw  INT DEFAULT 0,
    mm   INT DEFAULT 0,
    mt   INT DEFAULT 0,
    nbt  INT DEFAULT 0,
    am   INT DEFAULT 0,
    bm   INT DEFAULT 0,
    bbm  INT DEFAULT 0,
    pm   INT DEFAULT 0,
    st   INT DEFAULT 0,
    vke  INT DEFAULT 0,
    sf_lead_id               VARCHAR(36),
    lead_id                  VARCHAR(50),
    lead_auto_number         VARCHAR(50),
    description              TEXT,
    created_by               VARCHAR(100),
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
`;

// New columns added in schema v2 — each wrapped in its own try/catch
// so a "duplicate column" error on existing installs is silently ignored.
const MIGRATE_COLS = [
  `ALTER TABLE CRMRMD.leads ADD COLUMN salutation VARCHAR(20)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN rating VARCHAR(20)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN website VARCHAR(255)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN industry VARCHAR(100)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN is_converted TINYINT(1) DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN sf_lead_id VARCHAR(36)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN lead_id VARCHAR(50)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN lead_auto_number VARCHAR(50)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN alternate_mobile VARCHAR(20)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN alternate_mobile2 VARCHAR(20)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN alternate_email VARCHAR(200)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN sms_mobile VARCHAR(20)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN house_no VARCHAR(50)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN floor_no VARCHAR(50)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN building_wing_tower VARCHAR(100)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN society_apartment_name VARCHAR(200)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN society_name VARCHAR(200)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN street_colony_road VARCHAR(200)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN landmark VARCHAR(200)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN pocket_block VARCHAR(100)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN locality_name VARCHAR(200)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN locality_code VARCHAR(50)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN pincode VARCHAR(10)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN district VARCHAR(100)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN state VARCHAR(100)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN rmd_address TEXT`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN gender VARCHAR(20)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN birth_date DATE`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN age INT`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN age_group VARCHAR(50)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN education VARCHAR(100)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN occupation VARCHAR(100)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN income_range VARCHAR(50)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN no_of_children TINYINT DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN vertical VARCHAR(50)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN order_type VARCHAR(50)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN pre_prospect_record_type VARCHAR(100)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN primary_contact VARCHAR(50)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN call_status VARCHAR(50)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN visit_status VARCHAR(50)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN interested VARCHAR(10)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN publications VARCHAR(200)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN crm_email VARCHAR(200)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN owner_name VARCHAR(200)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN payee_name VARCHAR(200)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN branch_code VARCHAR(20)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN depot_code VARCHAR(20)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN agree_terms TINYINT(1) DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN opt_in TINYINT(1) DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN is_duplicate TINYINT(1) DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN is_institutional TINYINT(1) DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN is_serviceable TINYINT(1) DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN fresh_payment_flag TINYINT(1) DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN next_action_datetime DATETIME`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN next_action_remarks TEXT`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN appointment_datetime DATETIME`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN interested_on_date DATE`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN offer_valid_date DATE`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN order_expiry_date DATE`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN reason VARCHAR(200)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN interest VARCHAR(100)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN competition VARCHAR(100)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN reason_for_lost VARCHAR(200)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN renewal_payment_link VARCHAR(500)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN short_renewal_payment_link VARCHAR(200)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN measure_of_potential VARCHAR(100)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN number_of_copies INT DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN period_of_contract VARCHAR(50)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN potential_count INT DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN type_of_model VARCHAR(50)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN industry_type VARCHAR(100)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN industry_sub_category VARCHAR(100)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN day_of_delivery VARCHAR(50)`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN final_scheme_count INT DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN toi  INT DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN et   INT DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN etw  INT DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN mm   INT DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN mt   INT DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN nbt  INT DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN am   INT DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN bm   INT DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN bbm  INT DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN pm   INT DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN st   INT DEFAULT 0`,
  `ALTER TABLE CRMRMD.leads ADD COLUMN vke  INT DEFAULT 0`,
];

(async () => {
  try {
    await db.query(CREATE_SQL);
  } catch (e) {
    console.error('leads CREATE TABLE:', e.message);
  }
  // Auto-migrate: add missing columns (silently skip if column already exists)
  for (const sql of MIGRATE_COLS) {
    try { await db.query(sql); } catch (_) {}
  }
  console.log('leads table ready');
})();

// ── Helpers ───────────────────────────────────────────────────────────
function str(v)  { const s = v?.toString().trim(); return s || null; }
function num(v)  { return (v !== null && v !== undefined && v !== '') ? Number(v) : 0; }
function bool(v) { return v ? 1 : 0; }

function buildLeadData(body) {
  const b = body;
  return {
    record_type:              str(b.record_type)  || 'Household Fresh',
    salutation:               str(b.salutation),
    first_name:               str(b.first_name),
    last_name:                str(b.last_name),
    title:                    str(b.title),
    gender:                   str(b.gender),
    birth_date:               str(b.birth_date),
    age:                      b.age ? Number(b.age) : null,
    age_group:                str(b.age_group),
    education:                str(b.education),
    occupation:               str(b.occupation),
    income_range:             str(b.income_range),
    no_of_children:           num(b.no_of_children),
    phone:                    str(b.phone),
    mobile:                   str(b.mobile),
    alternate_mobile:         str(b.alternate_mobile),
    alternate_mobile2:        str(b.alternate_mobile2),
    email:                    str(b.email),
    alternate_email:          str(b.alternate_email),
    sms_mobile:               str(b.sms_mobile),
    house_no:                 str(b.house_no),
    floor_no:                 str(b.floor_no),
    building_wing_tower:      str(b.building_wing_tower),
    society_apartment_name:   str(b.society_apartment_name),
    society_name:             str(b.society_name),
    street_colony_road:       str(b.street_colony_road),
    landmark:                 str(b.landmark),
    pocket_block:             str(b.pocket_block),
    locality_name:            str(b.locality_name),
    locality_code:            str(b.locality_code),
    pincode:                  str(b.pincode),
    city:                     str(b.city),
    district:                 str(b.district),
    state:                    str(b.state),
    address:                  str(b.address),
    rmd_address:              str(b.rmd_address),
    company:                  str(b.company),
    industry:                 str(b.industry),
    rating:                   str(b.rating),
    website:                  str(b.website),
    vertical:                 str(b.vertical),
    order_type:               str(b.order_type),
    lead_status:              str(b.lead_status)  || 'New',
    lead_source:              str(b.lead_source),
    call_status:              str(b.call_status),
    visit_status:             str(b.visit_status),
    interested:               str(b.interested),
    primary_contact:          str(b.primary_contact),
    pre_prospect_record_type: str(b.pre_prospect_record_type),
    publications:             str(b.publications),
    branch_code:              str(b.branch_code),
    depot_code:               str(b.depot_code),
    crm_email:                str(b.crm_email),
    owner_name:               str(b.owner_name),
    payee_name:               str(b.payee_name),
    agree_terms:              bool(b.agree_terms),
    opt_in:                   bool(b.opt_in),
    is_converted:             bool(b.is_converted),
    is_duplicate:             bool(b.is_duplicate),
    is_institutional:         bool(b.is_institutional),
    is_serviceable:           bool(b.is_serviceable),
    fresh_payment_flag:       bool(b.fresh_payment_flag),
    next_action_datetime:     str(b.next_action_datetime),
    next_action_remarks:      str(b.next_action_remarks),
    appointment_datetime:     str(b.appointment_datetime),
    interested_on_date:       str(b.interested_on_date),
    offer_valid_date:         str(b.offer_valid_date),
    order_expiry_date:        str(b.order_expiry_date),
    reason:                   str(b.reason),
    interest:                 str(b.interest),
    competition:              str(b.competition),
    reason_for_lost:          str(b.reason_for_lost),
    renewal_payment_link:       str(b.renewal_payment_link),
    short_renewal_payment_link: str(b.short_renewal_payment_link),
    measure_of_potential:     str(b.measure_of_potential),
    number_of_copies:         num(b.number_of_copies),
    period_of_contract:       str(b.period_of_contract),
    potential_count:          num(b.potential_count),
    type_of_model:            str(b.type_of_model),
    industry_type:            str(b.industry_type),
    industry_sub_category:    str(b.industry_sub_category),
    day_of_delivery:          str(b.day_of_delivery),
    final_scheme_count:       num(b.final_scheme_count),
    toi:  num(b.toi),  et:  num(b.et),  etw: num(b.etw),
    mm:   num(b.mm),   mt:  num(b.mt),  nbt: num(b.nbt),
    am:   num(b.am),   bm:  num(b.bm),  bbm: num(b.bbm),
    pm:   num(b.pm),   st:  num(b.st),  vke: num(b.vke),
    sf_lead_id:       str(b.sf_lead_id),
    lead_id:          str(b.lead_id),
    lead_auto_number: str(b.lead_auto_number),
    description:      str(b.description),
  };
}

// ── Route handlers ────────────────────────────────────────────────────

async function searchLeads(req, res) {
  const { q } = req.query;
  try {
    if (q && q.trim().length > 0) {
      const sw = `%${q.trim()}%`;
      const [rows] = await db.query(
        `SELECT * FROM CRMRMD.leads
         WHERE last_name LIKE ? OR first_name LIKE ? OR company LIKE ?
            OR email LIKE ? OR phone LIKE ? OR mobile LIKE ?
            OR lead_id LIKE ? OR locality_name LIKE ?
         ORDER BY created_at DESC LIMIT 50`,
        [sw, sw, sw, sw, sw, sw, sw, sw]
      );
      return res.json(rows);
    }
    const [rows] = await db.query(
      `SELECT * FROM CRMRMD.leads ORDER BY created_at DESC LIMIT 20`
    );
    res.json(rows);
  } catch (e) {
    console.error('searchLeads:', e);
    res.status(500).json({ error: e.message });
  }
}

async function getLeadById(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT * FROM CRMRMD.leads WHERE id = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createLead(req, res) {
  if (!req.body.last_name?.toString().trim())
    return res.status(400).json({ error: 'Last Name is required' });

  try {
    const id   = crypto.randomUUID();
    const data = { id, ...buildLeadData(req.body), created_by: req.userId || null };
    const cols = Object.keys(data).join(', ');
    const ph   = Object.keys(data).map(() => '?').join(', ');
    await db.query(
      `INSERT INTO CRMRMD.leads (${cols}) VALUES (${ph})`,
      Object.values(data)
    );
    res.json({ success: true, id });
  } catch (e) {
    console.error('createLead:', e);
    res.status(500).json({ error: e.message });
  }
}

async function updateLead(req, res) {
  if (!req.body.last_name?.toString().trim())
    return res.status(400).json({ error: 'Last Name is required' });

  try {
    const data = buildLeadData(req.body);
    const sets = Object.keys(data).map(k => `${k}=?`).join(', ');
    await db.query(
      `UPDATE CRMRMD.leads SET ${sets} WHERE id=?`,
      [...Object.values(data), req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('updateLead:', e);
    res.status(500).json({ error: e.message });
  }
}

module.exports = { searchLeads, getLeadById, createLead, updateLead };
