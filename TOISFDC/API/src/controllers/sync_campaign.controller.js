/**
 * Sync Campaign Controller — Ameyo CTI Integration
 * Translated from:
 *   RMDUtilityCTIHelper, RMDControllerCTIRequest,
 *   RMDCmpServiceCTIRequest, RMDSelectorTelecallerAssignment,
 *   RMDSelectorCampaignMember
 *
 * Three-step sync flow (mirrors Apex):
 *   Step 1 — syncCampaign      : Login Ameyo → create Lead Table → save refid/uploadid to campaign
 *   Step 2 — syncTelecallers   : Login Ameyo → map agent IDs → set campaign-user mapping
 *   Step 3 — syncCampaignMembers: Login Ameyo → push all campaign members as customer records
 */
const db    = require('../config/database');
const axios = require('axios');

// ── Add CTI columns to existing tables if missing ─────────────────────
// (ALTER TABLE … ADD COLUMN IF NOT EXISTS is safe to run every boot)
const MIGRATIONS = [
  `ALTER TABLE CRMRMD.campaigns ADD COLUMN IF NOT EXISTS cti_parent_campaign            VARCHAR(100)  DEFAULT NULL`,
  `ALTER TABLE CRMRMD.campaigns ADD COLUMN IF NOT EXISTS cti_lead_id_for_user_mapping   DECIMAL(18,0) DEFAULT NULL`,
  `ALTER TABLE CRMRMD.campaigns ADD COLUMN IF NOT EXISTS cti_campaign_lead_id           DECIMAL(18,0) DEFAULT NULL`,
  `ALTER TABLE CRMRMD.campaigns ADD COLUMN IF NOT EXISTS cti_sync_status                VARCHAR(100)  DEFAULT NULL`,
  `ALTER TABLE CRMRMD.campaigns ADD COLUMN IF NOT EXISTS cti_error_reason               TEXT          DEFAULT NULL`,
  `ALTER TABLE CRMRMD.campaign_members ADD COLUMN IF NOT EXISTS sync_status             VARCHAR(50)   DEFAULT NULL`,
  `ALTER TABLE CRMRMD.campaign_members ADD COLUMN IF NOT EXISTS sync_message            TEXT          DEFAULT NULL`,
  `ALTER TABLE CRMRMD.telecaller_assignments ADD COLUMN IF NOT EXISTS sync_message      TEXT          DEFAULT NULL`,
];

(async () => {
  for (const sql of MIGRATIONS) {
    try { await db.query(sql); } catch (_) {}
  }
  console.log('CTI sync columns ready');
})();

// ── Config from .env ──────────────────────────────────────────────────
function cfg() {
  return {
    baseUrl:          process.env.AMEYO_BASE_URL,
    leadDetailsUrl:   process.env.AMEYO_LEAD_DETAILS_URL,
    uploadUrl:        process.env.AMEYO_UPLOAD_CONTACTS_URL,
    userId:           process.env.AMEYO_USER_ID,
    token:            process.env.AMEYO_TOKEN,
    terminal:         process.env.AMEYO_TERMINAL,
    // JSON map of SF CTI Parent Campaign name → Ameyo numeric campaign ID
    // e.g. {"Subscription":"1024","RenewalPush":"2048"}
    parentCampaigns:  process.env.AMEYO_PARENT_CAMPAIGNS_MAP
                        ? JSON.parse(process.env.AMEYO_PARENT_CAMPAIGNS_MAP)
                        : {},
  };
}

// ── Low-level HTTP helpers (mirrors PostInDialler / GetFromDialler) ───
async function ameyoPost(url, body, sessionId, contentType = 'application/json') {
  const headers = { 'Content-Type': contentType, accept: 'application/json' };
  if (sessionId) headers.sessionId = sessionId;
  const res = await axios.post(url, body, { headers, timeout: 30000 });
  return res.data;
}

async function ameyoGet(url) {
  const res = await axios.get(url, { headers: { accept: 'application/json' }, timeout: 30000 });
  return res.data;
}

// ── Step 0: Ameyo Login — mirrors getSessionId() ──────────────────────
async function getAmeyoSession() {
  const { baseUrl, userId, token, terminal } = cfg();
  if (!baseUrl) throw new Error('AMEYO_BASE_URL not configured in .env');

  const body = { userId, token, terminalInfo: terminal, forceLogin: true };
  const data = await ameyoPost(`${baseUrl}/session/userLogin`, body, '');
  if (!data?.sessionId) throw new Error(`Ameyo login failed — response: ${JSON.stringify(data)}`);
  return data.sessionId;
}

// ── Step 1a: Create Lead Table — mirrors CreateLeadTable() ───────────
async function createLeadTable(sessionId, parentCampaignId, campaignName) {
  const { baseUrl } = cfg();
  const body = { campaignId: parentCampaignId, leadName: campaignName, description: '', timeZone: '' };
  return ameyoPost(`${baseUrl}/cc/leads`, body, sessionId);
  // returns { campaignLeadId, leadName, campaignId, status, errorCode, message, info, ... }
}

// ── Step 1b: Get Lead Table Details — mirrors GetLeadDetails() ────────
// GET /leadDetails.php?campaignId=X&command=getLeadDetails
// Returns [{ campaignid, uploadid, refid, mappingid, name }, ...]
async function getLeadDetails(parentCampaignId) {
  const { leadDetailsUrl } = cfg();
  if (!leadDetailsUrl) throw new Error('AMEYO_LEAD_DETAILS_URL not configured in .env');
  const data = await ameyoGet(
    `${leadDetailsUrl}/leadDetails.php?campaignId=${parentCampaignId}&command=getLeadDetails`
  );
  return Array.isArray(data) ? data : [];
}

// ── Step 2a: Get Agent Mapping — mirrors getUserAgentId() ─────────────
// GET /leadDetails.php?campaignId=X&command=getCampaignUserMapping
// Returns { username.toLowerCase() → agentId }
async function getAgentMapping(parentCampaignId) {
  const { leadDetailsUrl } = cfg();
  const data = await ameyoGet(
    `${leadDetailsUrl}/leadDetails.php?campaignId=${parentCampaignId}&command=getCampaignUserMapping`
  );
  // data = [{ user_id, campaign_context_user_id, campaign_context_id }, ...]
  const map = {};
  if (Array.isArray(data)) {
    for (const u of data) {
      if (u.user_id) map[u.user_id.toLowerCase()] = String(u.campaign_context_user_id);
    }
  }
  return map;
}

// ── Step 3 helper: Upload contacts — mirrors sendRequestCampaignMember() ──
// POSTs as application/x-www-form-urlencoded: data=<url-encoded-json>
async function uploadCustomerRecords(payload) {
  const { uploadUrl } = cfg();
  if (!uploadUrl) throw new Error('AMEYO_UPLOAD_CONTACTS_URL not configured in .env');
  const body = 'data=' + encodeURIComponent(JSON.stringify(payload));
  return ameyoPost(uploadUrl, body, '', 'application/x-www-form-urlencoded');
  // returns { beanResponse: [{ inserted, customerId, resultTypeString, inputCustomerRecord }], message }
}

// ── DB helper ─────────────────────────────────────────────────────────
async function updateCampaignCTI(id, status, errReason = '') {
  await db.query(
    'UPDATE CRMRMD.campaigns SET cti_sync_status=?, cti_error_reason=? WHERE id=?',
    [status, errReason, id]
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ROUTE HANDLER 1: POST /api/campaign/:id/sync
// Mirrors: RMDCmpServiceCTIRequest → requestType='Sync Campaign'
// Creates/finds a Lead Table in Ameyo and saves refid + uploadid back to campaign.
// ═══════════════════════════════════════════════════════════════════════
async function syncCampaign(req, res) {
  const campaignId = req.params.id;
  try {
    const [rows] = await db.query('SELECT * FROM CRMRMD.campaigns WHERE id=?', [campaignId]);
    if (!rows.length) return res.status(404).json({ error: 'Campaign not found' });
    const campaign = rows[0];

    // Guards — mirrors Apex validations
    if (!campaign.cti_parent_campaign)
      return res.status(400).json({ error: 'Please set CTI Parent Campaign on the campaign before syncing.' });
    if (!campaign.active)
      return res.status(400).json({ error: 'Please activate the campaign before syncing.' });

    // Already successfully synced — skip (mirrors Apex equalsIgnoreCase check)
    if (campaign.cti_sync_status && campaign.cti_sync_status !== 'Campaign Sync Failed')
      return res.json({ success: true, message: 'Campaign already synced.', cti_sync_status: campaign.cti_sync_status });

    const { parentCampaigns } = cfg();
    const parentCampaignId = parentCampaigns[campaign.cti_parent_campaign];
    if (!parentCampaignId)
      return res.status(400).json({
        error: `No Ameyo campaign ID mapped for CTI parent "${campaign.cti_parent_campaign}". Update AMEYO_PARENT_CAMPAIGNS_MAP in .env.`,
      });

    // Step 0: Login to Ameyo
    const sessionId = await getAmeyoSession();

    // Step 1a: Create lead table in Ameyo (POST /cc/leads)
    const ltResp = await createLeadTable(sessionId, parentCampaignId, campaign.campaign_name);
    console.log('createLeadTable response:', JSON.stringify(ltResp));

    let refid, uploadid;

    if (ltResp.campaignLeadId) {
      // Newly created — fetch details by matching refid
      const details = await getLeadDetails(parentCampaignId);
      const match   = details.find(d => String(d.refid) === String(ltResp.campaignLeadId));
      if (!match) throw new Error('Lead table created in Ameyo but details not found via getLeadDetails.');
      refid    = match.refid;
      uploadid = match.uploadid;
    } else if (ltResp.status === 512 && ltResp.errorCode === 99999) {
      // Lead table with this name already exists — find by campaign name
      const details = await getLeadDetails(parentCampaignId);
      const match   = details.find(d => d.name === campaign.campaign_name);
      if (!match) throw new Error(`Lead table for "${campaign.campaign_name}" exists in Ameyo but not found by name.`);
      refid    = match.refid;
      uploadid = match.uploadid;
    } else {
      const errMsg = ltResp.info || ltResp.message || 'Lead table creation failed.';
      await updateCampaignCTI(campaignId, 'Campaign Sync Failed', errMsg);
      return res.json({ success: false, message: errMsg });
    }

    // Save refid + uploadid back to campaign (mirrors Apex update objCampaign)
    await db.query(
      `UPDATE CRMRMD.campaigns
          SET cti_lead_id_for_user_mapping=?, cti_campaign_lead_id=?,
              cti_sync_status='Campaign Sync Success', cti_error_reason=''
        WHERE id=?`,
      [refid, uploadid, campaignId]
    );

    res.json({ success: true, message: 'Campaign synced successfully.', refid, uploadid });
  } catch (e) {
    console.error('syncCampaign error:', e.message);
    await updateCampaignCTI(campaignId, 'Campaign Sync Failed', e.message).catch(() => {});
    res.status(500).json({ success: false, error: e.message });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ROUTE HANDLER 2: POST /api/campaign/:id/sync-telecallers
// Mirrors: RMDCmpServiceCTIRequest → requestType='Sync Telecallers'
// Maps Ameyo agent IDs for all active telecaller assignments to the campaign lead table.
// ═══════════════════════════════════════════════════════════════════════
async function syncTelecallers(req, res) {
  const campaignId = req.params.id;
  try {
    const [rows] = await db.query('SELECT * FROM CRMRMD.campaigns WHERE id=?', [campaignId]);
    if (!rows.length) return res.status(404).json({ error: 'Campaign not found' });
    const campaign = rows[0];

    if (!campaign.cti_lead_id_for_user_mapping)
      return res.status(400).json({ error: 'Please sync campaign first (Step 1: Sync Campaign).' });
    if (!campaign.cti_parent_campaign)
      return res.status(400).json({ error: 'CTI Parent Campaign not set on campaign.' });

    // Get active telecaller assignments (mirrors RMDSelectorTelecallerAssignment.getTelecaller)
    const [tans] = await db.query(
      `SELECT ta.*, u.email AS telecaller_email
         FROM CRMRMD.telecaller_assignments ta
         LEFT JOIN CRMRMD.users u ON u.id = ta.telecaller_id
        WHERE ta.campaign_id=? AND ta.is_active=1`,
      [campaignId]
    );
    if (!tans.length)
      return res.status(400).json({ error: 'Please add active telecallers to the campaign before syncing.' });

    const { parentCampaigns } = cfg();
    const parentCampaignId = parentCampaigns[campaign.cti_parent_campaign];
    if (!parentCampaignId)
      return res.status(400).json({ error: `No Ameyo campaign ID for CTI parent "${campaign.cti_parent_campaign}"` });

    // Login + fetch agent mapping from Ameyo
    // Ameyo user_id = SF username = our user's email (login identifier)
    const sessionId  = await getAmeyoSession();
    const agentMap   = await getAgentMapping(parentCampaignId); // { email.lower → agentId }

    if (!Object.keys(agentMap).length)
      return res.status(400).json({ error: 'No agent-user mapping found in Ameyo for this parent campaign.' });

    // Build agent ID set and track results per telecaller (mirrors CreateTelecallersList)
    const agentIdSet = new Set();
    const synced     = [];
    const failed     = [];

    for (const tan of tans) {
      // Try email (SF username equivalent) first, then name as fallback
      const emailKey = (tan.telecaller_email || '').toLowerCase();
      const nameKey  = (tan.telecaller_name  || '').toLowerCase();
      const agentId  = agentMap[emailKey] || agentMap[nameKey];

      if (agentId) {
        agentIdSet.add(parseInt(agentId, 10));
        synced.push(tan.id);
      } else {
        failed.push({
          id:     tan.id,
          reason: `Agent ID not found in Ameyo for telecaller: ${tan.telecaller_name} (${tan.telecaller_email || 'no email'})`,
        });
      }
    }

    if (!agentIdSet.size) {
      await updateCampaignCTI(campaignId, 'Telecallers Sync Failed', 'No telecallers matched Ameyo agent IDs.');
      return res.status(400).json({ error: 'No telecallers matched Ameyo agent IDs. Verify usernames/emails match.' });
    }

    // POST to Ameyo: set campaign-lead-user mapping
    const { baseUrl } = cfg();
    const body = {
      campaignLeadId:   parseInt(campaign.cti_lead_id_for_user_mapping, 10),
      campaignUserIds:  Array.from(agentIdSet),
    };
    const ameyoResp = await ameyoPost(
      `${baseUrl}/voice/setCampaignLeadUserMappingForCampaignLeadId`,
      body,
      sessionId
    );
    console.log('setCampaignLeadUserMapping response:', JSON.stringify(ameyoResp));

    const ameyoError = ameyoResp?.info || ameyoResp?.message;
    const errMsg     = ameyoError ? String(ameyoError) : null;

    // Update synced telecallers
    if (synced.length) {
      const newStatus  = errMsg ? 'Failed' : 'Synced';
      const newMessage = errMsg || '';
      await db.query(
        `UPDATE CRMRMD.telecaller_assignments SET sync_status=?, sync_message=? WHERE id IN (${synced.map(() => '?').join(',')})`,
        [newStatus, newMessage, ...synced]
      );
    }

    // Update failed (agent not found) telecallers
    for (const f of failed) {
      await db.query(
        'UPDATE CRMRMD.telecaller_assignments SET sync_status=?, sync_message=? WHERE id=?',
        ['Failed', f.reason, f.id]
      );
    }

    if (errMsg) {
      await updateCampaignCTI(campaignId, 'Telecallers Sync Failed', errMsg);
      return res.json({ success: false, message: errMsg });
    }

    await updateCampaignCTI(campaignId, 'Telecallers Sync Success', '');
    res.json({
      success: true,
      message: `Telecallers synced successfully. ${synced.length} synced, ${failed.length} failed.`,
      synced:  synced.length,
      failed:  failed.map(f => f.reason),
    });
  } catch (e) {
    console.error('syncTelecallers error:', e.message);
    await updateCampaignCTI(campaignId, 'Telecallers Sync Failed', e.message).catch(() => {});
    res.status(500).json({ success: false, error: e.message });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ROUTE HANDLER 3: POST /api/campaign/:id/sync-members
// Mirrors: RMDCmpServiceCTIRequest → requestType='Sync Campaign Member'
// Pushes all active campaign members (with phone) to Ameyo as customer records.
// Runs as fire-and-forget batch; client polls GET /:id/cti-status for progress.
// ═══════════════════════════════════════════════════════════════════════
async function syncCampaignMembers(req, res) {
  const campaignId = req.params.id;
  try {
    const [rows] = await db.query('SELECT * FROM CRMRMD.campaigns WHERE id=?', [campaignId]);
    if (!rows.length) return res.status(404).json({ error: 'Campaign not found' });
    const campaign = rows[0];

    if (!campaign.cti_campaign_lead_id)
      return res.status(400).json({ error: 'Please sync campaign first (Step 1: Sync Campaign).' });
    if (!campaign.active)
      return res.status(400).json({ error: 'Campaign is not active.' });
    if (campaign.cti_sync_status === 'Campaign Members Sync Initiated')
      return res.status(400).json({ error: 'Campaign Member sync already running. Please wait.' });

    const { parentCampaigns } = cfg();
    const parentCampaignId = parentCampaigns[campaign.cti_parent_campaign];
    if (!parentCampaignId)
      return res.status(400).json({ error: `No Ameyo campaign ID for CTI parent "${campaign.cti_parent_campaign}"` });

    // Mirrors RMDSelectorCampaignMember.getQueryForCTIBatch():
    // Only members with a primary contact number and whose campaign is active
    const [members] = await db.query(
      `SELECT cm.id, cm.lead_id, cm.status,
              COALESCE(l.mobile, cm.mobile) AS phone1
         FROM CRMRMD.campaign_members cm
         LEFT JOIN CRMRMD.leads l ON l.id = cm.lead_id
        WHERE cm.campaign_id=?
          AND COALESCE(l.mobile, cm.mobile) IS NOT NULL`,
      [campaignId]
    );
    if (!members.length)
      return res.status(400).json({ error: 'No campaign members with phone numbers found.' });

    // Mark as initiated (mirrors Apex update before batch)
    await updateCampaignCTI(campaignId, 'Campaign Members Sync Initiated', '');

    // Fire-and-forget (mirrors Database.executeBatch)
    setImmediate(() => runMemberSyncBatch(campaign, parentCampaignId, members));

    res.json({
      success: true,
      message: `Campaign Member sync initiated for ${members.length} members. Poll GET /api/campaign/${campaignId}/cti-status for progress.`,
      total:   members.length,
    });
  } catch (e) {
    console.error('syncCampaignMembers error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
}

// Batch worker — mirrors RMDBatchCTISync + RMDUtilityCTIHelper.Sync()
async function runMemberSyncBatch(campaign, parentCampaignId, members) {
  const CHUNK = 50; // batch size for Ameyo upload
  try {
    const sessionId = await getAmeyoSession();

    // Process in chunks to avoid Ameyo payload limits
    for (let i = 0; i < members.length; i += CHUNK) {
      const chunk = members.slice(i, i + CHUNK);

      const customerRecords = chunk.map(m => ({
        campaignId:       campaign.id,
        recordId:         m.lead_id || m.id,
        phone1:           m.phone1 || '',
        CampaignMemberid: m.id,
      }));

      const payload = {
        campaignId:  parentCampaignId,
        leadId:      campaign.cti_campaign_lead_id,
        sessionId,
        properties:  { 'update.customer': true, 'migrate.customer': true },
        status:      'NOT_TRIED',
        customerRecords,
      };

      const ameyoResp = await uploadCustomerRecords(payload);
      console.log(`Chunk ${i / CHUNK + 1} Ameyo response:`, JSON.stringify(ameyoResp));

      if (!ameyoResp?.beanResponse?.length) {
        // No beanResponse — mark all in this chunk as failed
        const errMsg = ameyoResp?.message || 'Empty beanResponse from Ameyo';
        for (const m of chunk) {
          await db.query(
            'UPDATE CRMRMD.campaign_members SET sync_status=?, sync_message=? WHERE id=?',
            ['Failed', errMsg, m.id]
          ).catch(() => {});
        }
        await updateCampaignCTI(campaign.id, 'Campaign Members Sync Failed', errMsg);
        return;
      }

      // Map beanResponse back to members (mirrors Apex beanResponse loop)
      const beans = ameyoResp.beanResponse;
      for (let j = 0; j < beans.length; j++) {
        const bean     = beans[j];
        const memberId = bean.inputCustomerRecord?.CampaignMemberid || (chunk[j] && chunk[j].id);
        if (!memberId) continue;
        await db.query(
          'UPDATE CRMRMD.campaign_members SET sync_status=?, sync_message=? WHERE id=?',
          [
            bean.inserted ? 'Synced' : 'Failed',
            bean.inserted ? '' : (bean.resultTypeString || ''),
            memberId,
          ]
        ).catch(() => {});
      }
    }

    // Only mark success if not already failed mid-batch (mirrors Apex EqualsIgnoreCase check)
    const [check] = await db.query('SELECT cti_sync_status FROM CRMRMD.campaigns WHERE id=?', [campaign.id]);
    if (check[0]?.cti_sync_status !== 'Campaign Members Sync Failed') {
      await updateCampaignCTI(campaign.id, 'Campaign Members Sync Success', '');
    }
    console.log(`Member sync complete for campaign ${campaign.id} — ${members.length} records`);
  } catch (e) {
    console.error(`runMemberSyncBatch [${campaign.id}] error:`, e.message);
    await updateCampaignCTI(campaign.id, 'Campaign Members Sync Failed', e.message).catch(() => {});
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ROUTE HANDLER 4: GET /api/campaign/:id/cti-status
// Returns current CTI sync state for a campaign + per-member sync counts
// ═══════════════════════════════════════════════════════════════════════
async function getCTIStatus(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT id, campaign_name, cti_parent_campaign,
              cti_sync_status, cti_error_reason,
              cti_lead_id_for_user_mapping, cti_campaign_lead_id
         FROM CRMRMD.campaigns WHERE id=?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Campaign not found' });

    // Member sync breakdown
    const [stats] = await db.query(
      `SELECT
          COUNT(*)                                        AS total,
          SUM(sync_status = 'Synced')                    AS synced,
          SUM(sync_status = 'Failed')                    AS failed,
          SUM(sync_status IS NULL OR sync_status = '')   AS pending
         FROM CRMRMD.campaign_members WHERE campaign_id=?`,
      [req.params.id]
    );

    res.json({ ...rows[0], member_sync: stats[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { syncCampaign, syncTelecallers, syncCampaignMembers, getCTIStatus };
