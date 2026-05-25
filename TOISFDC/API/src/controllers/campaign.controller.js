const db   = require('../config/database');
const comm = require('../services/communication.service');
const tmpl = require('./templates.controller');

const CREATE_CAMPAIGNS = `
  CREATE TABLE IF NOT EXISTS CRMRMD.campaigns (
    id                    VARCHAR(36)     NOT NULL PRIMARY KEY,
    campaign_name         VARCHAR(255)    NOT NULL,
    active                TINYINT(1)      DEFAULT 1,
    parent_campaign_id    VARCHAR(36)     DEFAULT NULL,
    type                  VARCHAR(50)     DEFAULT 'Event',
    status                VARCHAR(50)     DEFAULT NULL,
    start_date            DATE            DEFAULT NULL,
    end_date              DATE            DEFAULT NULL,
    description           TEXT            DEFAULT NULL,
    source                VARCHAR(50)     DEFAULT NULL,
    no_of_call_attempts   INT             DEFAULT 0,
    num_sent              INT             DEFAULT 0,
    budgeted_cost         DECIMAL(15,2)   DEFAULT NULL,
    expected_response_pct DECIMAL(5,2)    DEFAULT 0.00,
    actual_cost           DECIMAL(15,2)   DEFAULT NULL,
    expected_revenue      DECIMAL(15,2)   DEFAULT NULL,
    responses_in_campaign INT             DEFAULT 0,
    campaign_owner        VARCHAR(200)    DEFAULT NULL,
    created_by            VARCHAR(100)    DEFAULT NULL,
    created_at            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
`;

const CREATE_CAMPAIGN_MEMBERS = `
  CREATE TABLE IF NOT EXISTS CRMRMD.campaign_members (
    id           VARCHAR(36)  NOT NULL PRIMARY KEY,
    campaign_id  VARCHAR(36)  NOT NULL,
    member_type  VARCHAR(50)  DEFAULT 'Lead',
    lead_id      VARCHAR(36)  DEFAULT NULL,
    first_name   VARCHAR(100) DEFAULT NULL,
    last_name    VARCHAR(100) DEFAULT NULL,
    status       VARCHAR(50)  DEFAULT 'Sent',
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_campaign (campaign_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
`;

(async () => {
  try { await db.query(CREATE_CAMPAIGNS); } catch (e) { console.error('campaigns CREATE TABLE:', e.message); }
  try { await db.query(CREATE_CAMPAIGN_MEMBERS); } catch (e) { console.error('campaign_members CREATE TABLE:', e.message); }
  console.log('campaign tables ready');
})();

// ── Helpers ───────────────────────────────────────────────────────────
function str(v) { const s = v?.toString().trim(); return s || null; }
function num(v) { return (v !== null && v !== undefined && v !== '') ? Number(v) : null; }
function bool(v) { return v ? 1 : 0; }

function buildCampaignData(body) {
  const b = body;
  return {
    campaign_name:         str(b.campaign_name),
    active:                bool(b.active),
    parent_campaign_id:    str(b.parent_campaign_id),
    type:                  str(b.type) || 'Event',
    status:                str(b.status),
    start_date:            str(b.start_date),
    end_date:              str(b.end_date),
    description:           str(b.description),
    source:                str(b.source),
    no_of_call_attempts:   num(b.no_of_call_attempts) ?? 0,
    num_sent:              num(b.num_sent) ?? 0,
    budgeted_cost:         num(b.budgeted_cost),
    expected_response_pct: num(b.expected_response_pct) ?? 0,
    actual_cost:           num(b.actual_cost),
    expected_revenue:      num(b.expected_revenue),
    responses_in_campaign: num(b.responses_in_campaign) ?? 0,
    campaign_owner:        str(b.campaign_owner),
  };
}

// ── Route handlers ────────────────────────────────────────────────────

async function searchCampaigns(req, res) {
  const { q } = req.query;
  try {
    if (q && q.trim().length > 0) {
      const sw = `%${q.trim()}%`;
      const [rows] = await db.query(
        `SELECT c.*,
                p.campaign_name AS parent_campaign_name
           FROM CRMRMD.campaigns c
           LEFT JOIN CRMRMD.campaigns p ON p.id = c.parent_campaign_id
          WHERE c.campaign_name LIKE ? OR c.status LIKE ? OR c.type LIKE ?
          ORDER BY c.created_at DESC LIMIT 50`,
        [sw, sw, sw]
      );
      return res.json(rows);
    }
    const [rows] = await db.query(
      `SELECT c.*,
              p.campaign_name AS parent_campaign_name
         FROM CRMRMD.campaigns c
         LEFT JOIN CRMRMD.campaigns p ON p.id = c.parent_campaign_id
        ORDER BY c.created_at DESC LIMIT 20`
    );
    res.json(rows);
  } catch (e) {
    console.error('searchCampaigns:', e);
    res.status(500).json({ error: e.message });
  }
}

async function getCampaignById(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT c.*, p.campaign_name AS parent_campaign_name
         FROM CRMRMD.campaigns c
         LEFT JOIN CRMRMD.campaigns p ON p.id = c.parent_campaign_id
        WHERE c.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const campaign = rows[0];

    const [members] = await db.query(
      `SELECT cm.*, l.first_name AS lead_first_name, l.last_name AS lead_last_name,
              l.mobile, l.email
         FROM CRMRMD.campaign_members cm
         LEFT JOIN CRMRMD.leads l ON l.id = cm.lead_id
        WHERE cm.campaign_id = ?
        ORDER BY cm.created_at DESC`,
      [req.params.id]
    );

    res.json({ ...campaign, members });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createCampaign(req, res) {
  if (!req.body.campaign_name?.toString().trim())
    return res.status(400).json({ error: 'Campaign Name is required' });

  try {
    const id   = crypto.randomUUID();
    const data = { id, ...buildCampaignData(req.body), created_by: req.userId || null };
    const cols = Object.keys(data).join(', ');
    const ph   = Object.keys(data).map(() => '?').join(', ');
    await db.query(
      `INSERT INTO CRMRMD.campaigns (${cols}) VALUES (${ph})`,
      Object.values(data)
    );
    res.json({ success: true, id });
  } catch (e) {
    console.error('createCampaign:', e);
    res.status(500).json({ error: e.message });
  }
}

async function updateCampaign(req, res) {
  if (!req.body.campaign_name?.toString().trim())
    return res.status(400).json({ error: 'Campaign Name is required' });

  try {
    const data = buildCampaignData(req.body);
    const sets = Object.keys(data).map(k => `${k}=?`).join(', ');
    await db.query(
      `UPDATE CRMRMD.campaigns SET ${sets} WHERE id=?`,
      [...Object.values(data), req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('updateCampaign:', e);
    res.status(500).json({ error: e.message });
  }
}

async function addCampaignMember(req, res) {
  const { campaign_id, lead_id, first_name, last_name, member_type, status } = req.body;
  if (!campaign_id) return res.status(400).json({ error: 'campaign_id is required' });
  try {
    const id = crypto.randomUUID();
    await db.query(
      `INSERT INTO CRMRMD.campaign_members
         (id, campaign_id, lead_id, first_name, last_name, member_type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, campaign_id, lead_id || null, str(first_name), str(last_name),
       str(member_type) || 'Lead', str(status) || 'Sent']
    );
    res.json({ success: true, id });
  } catch (e) {
    console.error('addCampaignMember:', e);
    res.status(500).json({ error: e.message });
  }
}

// Returns all campaigns (id + name) for parent campaign search/picker
async function listCampaignNames(req, res) {
  try {
    const { q } = req.query;
    const sw = q ? `%${q.trim()}%` : null;
    const [rows] = sw
      ? await db.query(
          `SELECT id, campaign_name FROM CRMRMD.campaigns WHERE campaign_name LIKE ? ORDER BY campaign_name LIMIT 20`,
          [sw]
        )
      : await db.query(
          `SELECT id, campaign_name FROM CRMRMD.campaigns ORDER BY campaign_name LIMIT 20`
        );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── Standard Campaign: Member CSV map & validation ─────────────────────
const MEMBER_CSV_MAP = {
  'first name':    'first_name',
  'last name':     'last_name',
  'email':         'email',
  'mobile':        'mobile',
  'phone':         'phone',
  'company':       'company',
  'lead source':   'lead_source',
  'member status': 'status',
};

function validateMemberRow(row) {
  const errors = [];
  if (!row.last_name) errors.push('Last Name is required');
  if (row.mobile && !/^\d{10}$/.test(row.mobile.replace(/[\s\-]/g, ''))) errors.push('Mobile must be 10 digits');
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Invalid email format');
  if (row.first_name && row.first_name.length > 100) errors.push('First Name exceeds 100 chars');
  if (row.last_name && row.last_name.length > 100) errors.push('Last Name exceeds 100 chars');
  if (row.email && row.email.length > 200) errors.push('Email exceeds 200 chars');
  if (row.company && row.company.length > 200) errors.push('Company exceeds 200 chars');
  return errors;
}

// Creates a Lead then links it as a Campaign Member (standard campaign flow)
async function addMemberWithLead(req, res) {
  const { campaign_id, first_name, last_name, email, mobile, phone, company, lead_source, status } = req.body;
  if (!campaign_id) return res.status(400).json({ error: 'campaign_id is required' });
  if (!str(last_name)) return res.status(400).json({ error: 'Last Name is required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const leadId = crypto.randomUUID();
    await conn.query(
      `INSERT INTO CRMRMD.leads
         (id, first_name, last_name, email, mobile, phone, company, lead_source, lead_status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'New', ?)`,
      [leadId, str(first_name), str(last_name), str(email), str(mobile), str(phone), str(company), str(lead_source), req.userId || null]
    );
    const memberId = crypto.randomUUID();
    await conn.query(
      `INSERT INTO CRMRMD.campaign_members
         (id, campaign_id, lead_id, first_name, last_name, member_type, status)
       VALUES (?, ?, ?, ?, ?, 'Lead', ?)`,
      [memberId, campaign_id, leadId, str(first_name), str(last_name), str(status) || 'Sent']
    );
    await conn.commit();
    res.json({ success: true, lead_id: leadId, member_id: memberId });
  } catch (e) {
    await conn.rollback();
    console.error('addMemberWithLead:', e);
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
}

// Bulk CSV upload: validates each row, creates Lead + Campaign Member, returns success/failed list
async function bulkAddCampaignMembers(req, res) {
  const { campaign_id, records } = req.body;
  if (!campaign_id) return res.status(400).json({ error: 'campaign_id is required' });
  if (!Array.isArray(records) || !records.length) return res.status(400).json({ error: 'No records provided' });

  let inserted = 0;
  const failed = [];

  for (let i = 0; i < records.length; i++) {
    const raw = records[i];
    const row = {};
    for (const [csvKey, dbCol] of Object.entries(MEMBER_CSV_MAP)) {
      const val = raw[csvKey] ?? raw[dbCol] ?? raw[csvKey.replace(/ /g, '_')] ?? '';
      row[dbCol] = val ? val.toString().trim() : null;
    }

    const errs = validateMemberRow(row);
    if (errs.length) {
      failed.push({
        row: i + 2,
        name: [row.first_name, row.last_name].filter(Boolean).join(' ') || `Row ${i + 2}`,
        reason: errs.join('; '),
      });
      continue;
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const leadId = crypto.randomUUID();
      await conn.query(
        `INSERT INTO CRMRMD.leads
           (id, first_name, last_name, email, mobile, phone, company, lead_source, lead_status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'New', ?)`,
        [leadId, row.first_name, row.last_name, row.email, row.mobile, row.phone, row.company, row.lead_source, req.userId || null]
      );
      const memberId = crypto.randomUUID();
      await conn.query(
        `INSERT INTO CRMRMD.campaign_members
           (id, campaign_id, lead_id, first_name, last_name, member_type, status)
         VALUES (?, ?, ?, ?, ?, 'Lead', ?)`,
        [memberId, campaign_id, leadId, row.first_name, row.last_name, row.status || 'Sent']
      );
      await conn.commit();
      inserted++;
    } catch (e) {
      await conn.rollback();
      failed.push({
        row: i + 2,
        name: [row.first_name, row.last_name].filter(Boolean).join(' ') || `Row ${i + 2}`,
        reason: e.message,
      });
    } finally {
      conn.release();
    }
  }

  res.json({ success: true, inserted, total: records.length, failed });
}

// Get batch status by batch_id
async function getBatchStatus(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT * FROM CRMRMD.batch_logs WHERE id = ?', [req.params.batchId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Batch not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── Batch processor — mirrors RMDCampaignPromotationLeadNewCustomer Apex batch ──
async function runCommunicationBatch(batchId, campaignId, campaignSource, userId) {
  let sentWa = 0, sentSms = 0, sentEmail = 0, failedCount = 0;
  const errors = [];

  try {
    // Query promotion leads matching campaign_id + lead_source (mirrors Apex query)
    let rows;
    if (campaignSource) {
      [rows] = await db.query(
        `SELECT * FROM CRMRMD.promotion_leads
          WHERE campaign_id = ? AND lead_source = ?
          ORDER BY created_at`,
        [campaignId, campaignSource]
      );
    } else {
      [rows] = await db.query(
        `SELECT * FROM CRMRMD.promotion_leads WHERE campaign_id = ? ORDER BY created_at`,
        [campaignId]
      );
    }

    await db.query(
      'UPDATE CRMRMD.batch_logs SET total=? WHERE id=?',
      [rows.length, batchId]
    );

    // Process in chunks of 10 (matches Apex batch size)
    const CHUNK = 10;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);

      for (const pl of chunk) {
        // ── WhatsApp ──────────────────────────────────────────────────
        if (pl.is_send_wa && pl.whatsapp_template_name && pl.mobile_number) {
          try {
            await comm.sendWhatsApp(pl.mobile_number, pl.whatsapp_template_name, {
              var1: pl.wa_var1, var2: pl.wa_var2, var3: pl.wa_var3,
              var4: pl.wa_var4, var5: pl.wa_var5,
            });
            sentWa++;
          } catch (e) {
            failedCount++;
            errors.push(`WA [${pl.pln_number}]: ${e.message}`);
          }
        }

        // ── SMS ───────────────────────────────────────────────────────
        if (pl.is_send_sms && pl.sms_template_name && pl.mobile_number) {
          try {
            const smsTempl = await tmpl.getSmsTemplateByName(pl.sms_template_name);
            if (!smsTempl) throw new Error(`SMS template "${pl.sms_template_name}" not found`);
            const body = comm.substituteVars(smsTempl.body, {
              var1: pl.sms_var1, var2: pl.sms_var2, var3: pl.sms_var3, var4: pl.sms_var4,
            });
            await comm.sendSMS(pl.mobile_number, body, smsTempl.dlt_content_id);
            sentSms++;
          } catch (e) {
            failedCount++;
            errors.push(`SMS [${pl.pln_number}]: ${e.message}`);
          }
        }

        // ── Email ─────────────────────────────────────────────────────
        if (pl.is_send_email && pl.email && pl.email_template_name) {
          try {
            const emailTempl = await tmpl.getEmailTemplateByName(pl.email_template_name);
            if (!emailTempl) throw new Error(`Email template "${pl.email_template_name}" not found`);
            const body = comm.substituteVars(emailTempl.body, {
              var1: pl.em_var1, var2: pl.em_var2, var3: pl.em_var3, var4: pl.em_var4,
            });
            await comm.sendEmail(pl.email, emailTempl.subject, body);
            sentEmail++;
          } catch (e) {
            failedCount++;
            errors.push(`Email [${pl.pln_number}]: ${e.message}`);
          }
        }
      }
    }

    await db.query(
      `UPDATE CRMRMD.batch_logs
          SET status='completed', sent_wa=?, sent_sms=?, sent_email=?,
              failed_count=?, error_summary=?, finished_at=NOW()
        WHERE id=?`,
      [sentWa, sentSms, sentEmail, failedCount,
       errors.length ? errors.slice(0, 20).join('\n') : null, batchId]
    );
    console.log(`Batch ${batchId} done — WA:${sentWa} SMS:${sentSms} Email:${sentEmail} Failed:${failedCount}`);
  } catch (e) {
    console.error(`Batch ${batchId} error:`, e.message);
    await db.query(
      `UPDATE CRMRMD.batch_logs SET status='failed', error_summary=?, finished_at=NOW() WHERE id=?`,
      [e.message, batchId]
    );
  }
}

// Trigger communication batch for this campaign
async function callBatch(req, res) {
  try {
    const [camps] = await db.query('SELECT * FROM CRMRMD.campaigns WHERE id=?', [req.params.id]);
    if (!camps.length) return res.status(404).json({ error: 'Campaign not found' });
    const campaign = camps[0];

    const batchId = crypto.randomUUID();
    await db.query(
      `INSERT INTO CRMRMD.batch_logs (id, campaign_id, campaign_name, status, total)
       VALUES (?, ?, ?, 'running', 0)`,
      [batchId, campaign.id, campaign.campaign_name]
    );

    // Fire-and-forget — returns immediately, processes in background
    setImmediate(() => runCommunicationBatch(batchId, campaign.id, campaign.source, req.userId));

    res.json({
      success: true,
      batch_id: batchId,
      message: `Call batch started for campaign "${campaign.campaign_name}". Use batch_id to check status.`,
    });
  } catch (e) {
    console.error('callBatch:', e);
    res.status(500).json({ error: e.message });
  }
}

module.exports = {
  searchCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  addCampaignMember,
  addMemberWithLead,
  bulkAddCampaignMembers,
  listCampaignNames,
  callBatch,
  getBatchStatus,
};
