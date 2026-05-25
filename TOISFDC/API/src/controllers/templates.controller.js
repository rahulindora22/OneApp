/**
 * SMS Templates + Email Templates — CRUD
 * Equivalent to Salesforce RMD_SMS_Template__c and EmailTemplate objects
 */
const db = require('../config/database');

const CREATE_SMS_TEMPLATES = `
  CREATE TABLE IF NOT EXISTS CRMRMD.sms_templates (
    id              VARCHAR(36)  NOT NULL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    body            TEXT         NOT NULL,
    dlt_content_id  VARCHAR(100) DEFAULT NULL,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_name (name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

const CREATE_EMAIL_TEMPLATES = `
  CREATE TABLE IF NOT EXISTS CRMRMD.email_templates (
    id         VARCHAR(36)  NOT NULL PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    subject    VARCHAR(500) NOT NULL,
    body       TEXT         NOT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_name (name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

const CREATE_BATCH_LOGS = `
  CREATE TABLE IF NOT EXISTS CRMRMD.batch_logs (
    id             VARCHAR(36)  NOT NULL PRIMARY KEY,
    campaign_id    VARCHAR(36)  NOT NULL,
    campaign_name  VARCHAR(255) DEFAULT NULL,
    status         VARCHAR(20)  DEFAULT 'running',
    total          INT          DEFAULT 0,
    sent_wa        INT          DEFAULT 0,
    sent_sms       INT          DEFAULT 0,
    sent_email     INT          DEFAULT 0,
    failed_count   INT          DEFAULT 0,
    error_summary  TEXT         DEFAULT NULL,
    started_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    finished_at    TIMESTAMP    NULL,
    INDEX idx_campaign (campaign_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

(async () => {
  try { await db.query(CREATE_SMS_TEMPLATES);   } catch (e) { console.error('sms_templates:', e.message); }
  try { await db.query(CREATE_EMAIL_TEMPLATES); } catch (e) { console.error('email_templates:', e.message); }
  try { await db.query(CREATE_BATCH_LOGS);      } catch (e) { console.error('batch_logs:', e.message); }
  console.log('templates & batch_logs tables ready');
})();

// ── Internal lookup by name (used by batch processor) ─────────────────
async function getSmsTemplateByName(name) {
  const [rows] = await db.query(
    'SELECT * FROM CRMRMD.sms_templates WHERE name = ? LIMIT 1', [name]
  );
  return rows[0] || null;
}

async function getEmailTemplateByName(name) {
  const [rows] = await db.query(
    'SELECT * FROM CRMRMD.email_templates WHERE name = ? LIMIT 1', [name]
  );
  return rows[0] || null;
}

// ── SMS Templates ──────────────────────────────────────────────────────
async function listSmsTemplates(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM CRMRMD.sms_templates ORDER BY name');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

async function getSmsTemplate(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM CRMRMD.sms_templates WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

async function createSmsTemplate(req, res) {
  const { name, body, dlt_content_id } = req.body;
  if (!name?.trim() || !body?.trim())
    return res.status(400).json({ error: 'name and body are required' });
  try {
    const id = crypto.randomUUID();
    await db.query(
      'INSERT INTO CRMRMD.sms_templates (id, name, body, dlt_content_id) VALUES (?, ?, ?, ?)',
      [id, name.trim(), body.trim(), dlt_content_id || null]
    );
    res.json({ success: true, id });
  } catch (e) {
    const isDup = e.code === 'ER_DUP_ENTRY';
    res.status(isDup ? 409 : 500).json({ error: isDup ? 'Template name already exists' : e.message });
  }
}

async function updateSmsTemplate(req, res) {
  const { name, body, dlt_content_id } = req.body;
  try {
    await db.query(
      'UPDATE CRMRMD.sms_templates SET name=?, body=?, dlt_content_id=? WHERE id=?',
      [name, body, dlt_content_id || null, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

// ── Email Templates ────────────────────────────────────────────────────
async function listEmailTemplates(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM CRMRMD.email_templates ORDER BY name');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

async function getEmailTemplate(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM CRMRMD.email_templates WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

async function createEmailTemplate(req, res) {
  const { name, subject, body } = req.body;
  if (!name?.trim() || !subject?.trim() || !body?.trim())
    return res.status(400).json({ error: 'name, subject, and body are required' });
  try {
    const id = crypto.randomUUID();
    await db.query(
      'INSERT INTO CRMRMD.email_templates (id, name, subject, body) VALUES (?, ?, ?, ?)',
      [id, name.trim(), subject.trim(), body.trim()]
    );
    res.json({ success: true, id });
  } catch (e) {
    const isDup = e.code === 'ER_DUP_ENTRY';
    res.status(isDup ? 409 : 500).json({ error: isDup ? 'Template name already exists' : e.message });
  }
}

async function updateEmailTemplate(req, res) {
  const { name, subject, body } = req.body;
  try {
    await db.query(
      'UPDATE CRMRMD.email_templates SET name=?, subject=?, body=? WHERE id=?',
      [name, subject, body, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

// ── Batch Logs ─────────────────────────────────────────────────────────
async function getBatchLogs(req, res) {
  const { campaign_id } = req.query;
  try {
    const [rows] = campaign_id
      ? await db.query('SELECT * FROM CRMRMD.batch_logs WHERE campaign_id=? ORDER BY started_at DESC LIMIT 20', [campaign_id])
      : await db.query('SELECT * FROM CRMRMD.batch_logs ORDER BY started_at DESC LIMIT 50');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

async function getBatchLog(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM CRMRMD.batch_logs WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

module.exports = {
  getSmsTemplateByName, getEmailTemplateByName,
  listSmsTemplates, getSmsTemplate, createSmsTemplate, updateSmsTemplate,
  listEmailTemplates, getEmailTemplate, createEmailTemplate, updateEmailTemplate,
  getBatchLogs, getBatchLog,
};
