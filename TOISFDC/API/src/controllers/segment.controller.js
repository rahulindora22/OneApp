/**
 * Converted from Apex: SegmentController.cls
 * All SOQL queries → MySQL equivalents on the same relational schema.
 */
const crypto = require('crypto');
const db = require('../config/database');

// ── displayMasterComponent ─────────────────────────────────────────
// Checks if the logged-in user has at least one active user role.
async function displayMasterComponent(req, res) {
  try {
    const userId = req.userId;
    const [rows] = await db.query(
      `SELECT ur.id FROM CRMRMD.user_roles ur
       WHERE ur.user_id = ? AND ur.is_active = 1
       LIMIT 1`,
      [userId]
    );
    res.json(rows.length > 0 ? 'SUCCESS' : 'Error');
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── displaySegmentsRWA ─────────────────────────────────────────────
// Queries both DBs separately to avoid UNION collation conflicts.
async function displaySegmentsRWA(req, res) {
  const { searchkey } = req.query;
  if (!searchkey || searchkey.length < 3) return res.json([]);
  const sw = `%${searchkey}%`;

  let rows1 = [], rows2 = [];
  try {
    [rows1] = await db.query(
      `SELECT s.id, s.record_type, s.name_of_society, s.slab, s.category,
              s.address, s.city, l.name AS locality_name, s.locality_id,
              s.pin_code, NULL AS locality_pincode,
              s.depot_id, d.name AS depot_name,
              s.premiumness, s.delivery_mode, s.total_flats, s.occupied_flats,
              NULL AS branch_name, s.segment_branch_id, 'oneapp' AS source
       FROM OneApp.segments s
       LEFT JOIN OneApp.localities l ON s.locality_id = l.id
       LEFT JOIN OneApp.rmd_territory_master d ON s.depot_id = d.id
       WHERE s.record_type = 'RWA'
         AND (s.name_of_society LIKE ? OR s.pin_code LIKE ? OR s.address LIKE ? OR l.name LIKE ?)`,
      [sw, sw, sw, sw]
    );
  } catch (_) {}
  try {
    [rows2] = await db.query(
      `SELECT cs.id, cs.record_type, cs.name_of_society, cs.slab, cs.category,
              cs.address, cs.city, cs.locality_name, cs.locality_id,
              cs.pin_code, cs.locality_pincode, cs.depot_id, cs.depot_name,
              cs.premiumness, cs.delivery_mode, cs.total_flats, cs.occupied_flats,
              cs.branch_name, cs.segment_branch_id, 'crmrmd' AS source
       FROM CRMRMD.segments cs
       WHERE cs.record_type = 'RWA'
         AND (cs.name_of_society LIKE ? OR cs.pin_code LIKE ? OR cs.address LIKE ? OR cs.locality_name LIKE ?)`,
      [sw, sw, sw, sw]
    );
  } catch (_) {}
  res.json([...rows1, ...rows2]);
}

// ── displaySegmentsOOH ─────────────────────────────────────────────
async function displaySegmentsOOH(req, res) {
  const { searchkey } = req.query;
  if (!searchkey || searchkey.length < 3) return res.json([]);
  const sw = `%${searchkey}%`;

  let rows1 = [], rows2 = [];
  try {
    [rows1] = await db.query(
      `SELECT s.id, s.record_type, s.name_of_society, s.category, s.sub_category,
              s.ooh_type AS type, s.measure_of_potential, s.potential_count,
              s.premium_status AS premiumness, s.address,
              l.name AS locality_name, s.locality_id,
              s.depot_id, d.name AS depot_name,
              NULL AS branch_name, s.segment_branch_id, 'oneapp' AS source
       FROM OneApp.segments s
       LEFT JOIN OneApp.localities l ON s.locality_id = l.id
       LEFT JOIN OneApp.rmd_territory_master d ON s.depot_id = d.id
       WHERE s.record_type = 'OOH'
         AND (s.name_of_society LIKE ? OR s.address LIKE ? OR s.category LIKE ? OR l.name LIKE ?)`,
      [sw, sw, sw, sw]
    );
  } catch (_) {}
  try {
    [rows2] = await db.query(
      `SELECT cs.id, cs.record_type, cs.name_of_society, cs.category, cs.sub_category,
              cs.type, cs.measure_of_potential, cs.potential_count,
              cs.premiumness, cs.address,
              cs.locality_name, cs.locality_id,
              cs.depot_id, cs.depot_name,
              cs.branch_name, cs.segment_branch_id, 'crmrmd' AS source
       FROM CRMRMD.segments cs
       WHERE cs.record_type = 'OOH'
         AND (cs.name_of_society LIKE ? OR cs.address LIKE ? OR cs.category LIKE ? OR cs.locality_name LIKE ?)`,
      [sw, sw, sw, sw]
    );
  } catch (_) {}
  res.json([...rows1, ...rows2]);
}

// ── displaySegmentsCSP ─────────────────────────────────────────────
async function displaySegmentsCSP(req, res) {
  const { searchkey } = req.query;
  if (!searchkey || searchkey.length < 3) return res.json([]);
  const sw = `%${searchkey}%`;

  let rows1 = [], rows2 = [];
  try {
    [rows1] = await db.query(
      `SELECT s.id, s.record_type, s.name_of_society, s.category,
              CAST(s.premiumness AS CHAR) AS premiumness, s.address,
              l.name AS locality_name, s.locality_id,
              s.depot_id, d.name AS depot_name,
              NULL AS branch_name, s.segment_branch_id, 'oneapp' AS source
       FROM OneApp.segments s
       LEFT JOIN OneApp.localities l ON s.locality_id = l.id
       LEFT JOIN OneApp.rmd_territory_master d ON s.depot_id = d.id
       WHERE s.record_type = 'CSP'
         AND (s.name_of_society LIKE ? OR s.address LIKE ? OR s.category LIKE ? OR l.name LIKE ?)`,
      [sw, sw, sw, sw]
    );
  } catch (_) {}
  try {
    [rows2] = await db.query(
      `SELECT cs.id, cs.record_type, cs.name_of_society, cs.category,
              cs.premiumness, cs.address,
              cs.locality_name, cs.locality_id,
              cs.depot_id, cs.depot_name,
              cs.branch_name, cs.segment_branch_id, 'crmrmd' AS source
       FROM CRMRMD.segments cs
       WHERE cs.record_type = 'CSP'
         AND (cs.name_of_society LIKE ? OR cs.address LIKE ? OR cs.category LIKE ? OR cs.locality_name LIKE ?)`,
      [sw, sw, sw, sw]
    );
  } catch (_) {}
  res.json([...rows1, ...rows2]);
}

// ── displaySegmentsDEPO ───────────────────────────────────────────
// Returns all active DEPOT territories assigned to the logged-in user via CRMRMD.user_roles.
async function displaySegmentsDEPO(req, res) {
  try {
    const userId = req.userId;
    const [rows] = await db.query(
      `SELECT ur.id, ur.territory_id, ur.user_id, ur.type,
              t.territory_name, t.territory_code, t.territory_type,
              t.branch_id, t.geo_location,
              u.mobile_id
       FROM CRMRMD.user_roles ur
       JOIN CRMRMD.territory t ON ur.territory_id = t.territory_id AND t.is_active = 1
       JOIN CRMRMD.users u     ON ur.user_id = u.id
       WHERE ur.user_id = ?
         AND ur.is_active = 1
         AND t.territory_type = 'DEPOT'
       ORDER BY t.territory_name`,
      [userId]
    );
    const result = rows.map(r => ({
      Id: r.id,
      RMD_Territory_Master__c: String(r.territory_id),
      RMD_Territory_Master__r: {
        Name: r.territory_name,
        RMD_SAP_Code__c: r.territory_code,
        RMD_SAP_Unique_Code__c: r.territory_code,
        RMD_Branch__c: r.branch_id,
        RMD_Branch__r: { Name: r.branch_id },
        RMD_Territory_Type__c: r.territory_type,
      },
      RMD_Territory_Type__c: r.territory_type,
      RMD_User__c: r.user_id,
      RMD_User__r: { Mobile_Id__c: r.mobile_id },
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── getSegmentContacts ─────────────────────────────────────────────
async function getSegmentContacts(req, res) {
  try {
    const { segmentId } = req.query;
    const [rows] = await db.query(
      `SELECT id, email, name, phone, segment_id, designation
       FROM OneApp.segment_contacts
       WHERE segment_id = ? AND record_type = 'Contact'`,
      [segmentId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── getSegmentContactVendor ────────────────────────────────────────
async function getSegmentContactVendor(req, res) {
  try {
    const { segmentId } = req.query;
    const [rows] = await db.query(
      `SELECT sc.id, sc.email, sc.name, sc.phone, sc.segment_id,
              sc.business_partner_id, bp.rmd_first_name, bp.rmd_last_name
       FROM OneApp.segment_contacts sc
       LEFT JOIN OneApp.rmd_business_partners bp ON sc.business_partner_id = bp.id
       WHERE sc.segment_id = ? AND sc.record_type = 'Vendor'`,
      [segmentId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── saveSegmentContacts ────────────────────────────────────────────
async function saveSegmentContacts(req, res) {
  try {
    const { name, email, phone, designation, businessId, segmentId } = req.body;

    if (businessId) {
      const [bp] = await db.query(
        'SELECT id, rmd_first_name, rmd_last_name, rmd_email, rmd_phone FROM OneApp.rmd_business_partners WHERE id = ?',
        [businessId]
      );
      if (bp.length === 0) return res.status(404).json({ error: 'Business partner not found' });
      const partner = bp[0];
      await db.query(
        `INSERT INTO OneApp.segment_contacts (name, email, phone, segment_id, record_type, business_partner_id)
         VALUES (?, ?, ?, ?, 'Vendor', ?)`,
        [`${partner.rmd_first_name} ${partner.rmd_last_name}`, partner.rmd_email, partner.rmd_phone, segmentId, businessId]
      );
    } else {
      await db.query(
        `INSERT INTO OneApp.segment_contacts (name, email, phone, designation, segment_id, record_type)
         VALUES (?, ?, ?, ?, ?, 'Contact')`,
        [name, email, phone, designation, segmentId]
      );
    }
    res.json('Success');
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── saveTransDetail ────────────────────────────────────────────────
async function saveTransDetail(req, res) {
  try {
    const { tssList } = req.body;
    if (!Array.isArray(tssList) || tssList.length === 0) {
      return res.status(400).json({ error: 'tssList is required' });
    }
    const inserts = tssList.map(t => [
      t.Name || t.name,
      t.Segment__c || t.segment_id,
      t.FTD_Count__c ?? t.ftd_count ?? 0,
      t.Choose_Company__c || t.choose_company || null,
      t.Choose_Newspaper__c || t.choose_newspaper || null,
    ]);
    await db.query(
      `INSERT INTO OneApp.transactional_details (name, segment_id, ftd_count, choose_company, choose_newspaper, check_in_date)
       VALUES ?`,
      [inserts.map(r => [...r, new Date()])]
    );
    res.json('Success');
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── getTDPicklistValues ────────────────────────────────────────────
// Returns company picklist values stored in a config table.
async function getTDPicklistValues(_req, res) {
  try {
    const [rows] = await db.query(
      "SELECT value, label FROM OneApp.picklist_values WHERE field_name = 'choose_company' ORDER BY sort_order"
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── getTypes ───────────────────────────────────────────────────────
async function getTypes(_req, res) {
  try {
    const [rows] = await db.query(
      'SELECT id, name, choose_newspaper FROM OneApp.transactional_details LIMIT 200'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── getNeswpaperPicklist ───────────────────────────────────────────
async function getNeswpaperPicklist(req, res) {
  try {
    const { recordId } = req.query;
    const [segRows] = await db.query(
      'SELECT id, segment_branch_id FROM OneApp.segments WHERE id = ? LIMIT 1',
      [recordId]
    );
    if (segRows.length === 0) return res.json([]);
    const seg = segRows[0];

    const [selected] = await db.query(
      'SELECT name FROM OneApp.transactional_details WHERE segment_id = ?',
      [recordId]
    );
    const selectedNames = selected.map(r => r.name);

    const [products] = await db.query(
      `SELECT name FROM OneApp.products
       WHERE rmd_branch_id = ? AND mandatory_for_rwa = 0 AND is_active = 1`,
      [seg.segment_branch_id]
    );

    const result = products
      .filter(p => !selectedNames.includes(p.name))
      .map(p => ({ label: p.name, value: p.name }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── getTransDetails ────────────────────────────────────────────────
async function getTransDetails(req, res) {
  try {
    const { segmentId } = req.query;
    const [rows] = await db.query(
      `SELECT id, name, last_visit, second_last_visit, ftd_count
       FROM OneApp.transactional_details WHERE segment_id = ? ORDER BY created_at ASC`,
      [segmentId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── viewTransactionDetails ─────────────────────────────────────────
async function viewTransactionDetails(req, res) {
  try {
    const { recordId } = req.query;
    const [rows] = await db.query(
      `SELECT id, name, last_visit, second_last_visit, segment_id, ftd_count
       FROM OneApp.transactional_details WHERE segment_id = ?`,
      [recordId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── viewTransactionDetailsSecondTime ──────────────────────────────
// Mirrors GeolocationController.viewTransactionDetailsSecondTime
async function viewTransactionDetailsSecondTime(req, res) {
  try {
    const { recordId } = req.query;
    const segType = req.query.segType || 'RWA'; // RWA | CSP | OOH

    const [segRows] = await db.query(
      'SELECT id, segment_branch_id, last_check_in_date FROM OneApp.segments WHERE id = ? LIMIT 1',
      [recordId]
    );
    if (segRows.length === 0) return res.json({ dataTable: [], dataHeader: {} });
    const seg = segRows[0];

    const mandatoryCol =
      segType === 'CSP' ? 'mandatory_for_csp' : segType === 'OOH' ? 'mandatory_for_ooh' : 'mandatory_for_rwa';

    const [products] = await db.query(
      `SELECT name FROM OneApp.products WHERE rmd_branch_id = ? AND ${mandatoryCol} = 1 AND is_active = 1`,
      [seg.segment_branch_id]
    );
    const mandatoryNames = new Set(products.map(p => p.name));

    const [txnList] = await db.query(
      `SELECT id, name, last_visit, ftd_covid_count, second_last_visit, is_pre_covid_count,
              ftd_count, visit_date, check_in_date
       FROM OneApp.transactional_details WHERE segment_id = ? ORDER BY created_at ASC`,
      [recordId]
    );

    const preCovidMap = {};
    txnList.filter(t => t.is_pre_covid_count).forEach(t => {
      preCovidMap[t.name] = t.ftd_covid_count;
    });

    txnList.forEach(t => mandatoryNames.delete(t.name));

    const mapOfName = {};
    mandatoryNames.forEach(s => {
      mapOfName[s] = { name: s, secondlastdate: 0, lastdate: 0, count: 0 };
    });

    const covidCheck = { value: false };
    for (const td of txnList) {
      const dc = preCovidMap[td.name] || 0;
      if (td.is_pre_covid_count) {
        mapOfName[td.name] = { name: td.name, secondlastdate: td.second_last_visit, count: dc };
        covidCheck.value = true;
      } else {
        mapOfName[td.name] = {
          name: td.name,
          secondlastdate: td.second_last_visit,
          lastdate: td.last_visit,
          count: dc,
        };
        covidCheck.value = true;
      }
    }

    let lastVisit = null;
    if (seg.last_check_in_date) {
      const d = new Date(seg.last_check_in_date);
      lastVisit = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }

    res.json({
      dataTable: Object.values(mapOfName),
      dataHeader: {
        lastVisit,
        visitDate: seg.last_check_in_date,
        covidCheck: covidCheck.value,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── createRWA — POST /api/segment/rwa ─────────────────────────────
async function createRWA(req, res) {
  try {
    const id = crypto.randomUUID();
    const b = req.body;
    await db.query(
      `INSERT INTO CRMRMD.segments
         (id, record_type, name_of_society, address, slab, premiumness, category, city,
          pin_code, locality_pincode, delivery_mode, total_flats, occupied_flats,
          depot_id, depot_name, locality_id, locality_name,
          segment_branch_id, branch_name,
          approved_geo_lat, approved_geo_lng,
          pending_approval_lat, pending_approval_lng,
          pending_approval1_lat, pending_approval1_lng,
          location_approval_status, sub_category, type,
          measure_of_potential, potential_count,
          has_pre_covid_count, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, b.record_type || 'RWA',
        b.name_of_society || null, b.address || null,
        b.slab || null, b.premiumness || null, b.category || null, b.city || null,
        b.pin_code || null, b.locality_pincode || null, b.delivery_mode || null,
        b.total_flats ? parseInt(b.total_flats) : null,
        b.occupied_flats ? parseInt(b.occupied_flats) : null,
        b.depot_id || null, b.depot_name || null,
        b.locality_id || null, b.locality_name || null,
        b.segment_branch_id || null, b.branch_name || null,
        b.approved_geo_lat || null, b.approved_geo_lng || null,
        b.pending_approval_lat || null, b.pending_approval_lng || null,
        b.pending_approval1_lat || null, b.pending_approval1_lng || null,
        b.location_approval_status || 'Pending',
        b.sub_category || null, b.type || null,
        b.measure_of_potential || null, b.potential_count || null,
        b.has_pre_covid_count ? 1 : 0,
        req.userId,
      ]
    );
    res.json({ success: true, id, message: 'RWA record created successfully.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// ── updateRWA — PUT /api/segment/rwa/:id ──────────────────────────
async function updateRWA(req, res) {
  try {
    const { id } = req.params;
    const b = req.body;
    await db.query(
      `UPDATE CRMRMD.segments
       SET name_of_society = ?, address = ?, slab = ?, premiumness = ?, category = ?,
           city = ?, pin_code = ?, locality_pincode = ?, delivery_mode = ?,
           total_flats = ?, occupied_flats = ?,
           depot_id = ?, depot_name = ?, locality_id = ?, locality_name = ?,
           segment_branch_id = ?, branch_name = ?,
           sub_category = ?, type = ?,
           measure_of_potential = ?, potential_count = ?
       WHERE id = ?`,
      [
        b.name_of_society || null, b.address || null,
        b.slab || null, b.premiumness || null, b.category || null, b.city || null,
        b.pin_code || null, b.locality_pincode || null, b.delivery_mode || null,
        b.total_flats ? parseInt(b.total_flats) : null,
        b.occupied_flats ? parseInt(b.occupied_flats) : null,
        b.depot_id || null, b.depot_name || null,
        b.locality_id || null, b.locality_name || null,
        b.segment_branch_id || null, b.branch_name || null,
        b.sub_category || null, b.type || null,
        b.measure_of_potential || null, b.potential_count || null,
        id,
      ]
    );
    res.json({ success: true, message: 'RWA record updated successfully.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// ── getRWAById — GET /api/segment/rwa/:id ─────────────────────────
async function getRWAById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM CRMRMD.segments WHERE id = ? LIMIT 1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// ── searchDepots — GET /api/segment/search-depots?q=... ───────────
// Primary source: CRMRMD.territory (territory_id, territory_name, territory_type, branch_id)
// Fallback: OneApp.rmd_territory_master
async function searchDepots(req, res) {
  try {
    const q = req.query.q || '';
    if (q.length < 2) return res.json([]);
    const sw = `%${q}%`;

    const [rows] = await db.query(
      `SELECT CAST(t.territory_id AS CHAR) AS id,
              t.territory_name AS name,
              t.branch_id AS rmd_branch_id,
              t.branch_id AS branch_name
       FROM CRMRMD.territory t
       WHERE t.territory_name LIKE ?
         AND t.territory_type = 'DEPOT'
         AND t.is_active = 1
       ORDER BY t.territory_name
       LIMIT 20`,
      [sw]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// ── createOOH — POST /api/segment/ooh ────────────────────────────
async function createOOH(req, res) {
  try {
    const id = crypto.randomUUID();
    const b = req.body;
    await db.query(
      `INSERT INTO CRMRMD.segments
         (id, record_type, name_of_society, address, premiumness, category,
          sub_category, type, measure_of_potential, potential_count,
          depot_id, depot_name, locality_id, locality_name,
          segment_branch_id, branch_name, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, 'OOH',
        b.name_of_society || null, b.address || null,
        b.premiumness || null, b.category || null,
        b.sub_category || null, b.type || null,
        b.measure_of_potential || null,
        b.potential_count ? parseInt(b.potential_count) : null,
        b.depot_id || null, b.depot_name || null,
        b.locality_id || null, b.locality_name || null,
        b.segment_branch_id || null, b.branch_name || null,
        req.userId,
      ]
    );
    res.json({ success: true, id, message: 'OOH record created successfully.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// ── updateOOH — PUT /api/segment/ooh/:id ─────────────────────────
async function updateOOH(req, res) {
  try {
    const { id } = req.params;
    const b = req.body;
    await db.query(
      `UPDATE CRMRMD.segments
       SET name_of_society = ?, address = ?, premiumness = ?, category = ?,
           sub_category = ?, type = ?, measure_of_potential = ?, potential_count = ?,
           depot_id = ?, depot_name = ?, locality_id = ?, locality_name = ?,
           segment_branch_id = ?, branch_name = ?
       WHERE id = ?`,
      [
        b.name_of_society || null, b.address || null,
        b.premiumness || null, b.category || null,
        b.sub_category || null, b.type || null,
        b.measure_of_potential || null,
        b.potential_count ? parseInt(b.potential_count) : null,
        b.depot_id || null, b.depot_name || null,
        b.locality_id || null, b.locality_name || null,
        b.segment_branch_id || null, b.branch_name || null,
        id,
      ]
    );
    res.json({ success: true, message: 'OOH record updated successfully.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// ── getOOHById — GET /api/segment/ooh/:id ────────────────────────
async function getOOHById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM CRMRMD.segments WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Record not found.' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// ── createCSP — POST /api/segment/csp ────────────────────────────
async function createCSP(req, res) {
  try {
    const id = crypto.randomUUID();
    const b = req.body;
    await db.query(
      `INSERT INTO CRMRMD.segments
         (id, record_type, name_of_society, address, premiumness, category,
          depot_id, depot_name, locality_id, locality_name,
          segment_branch_id, branch_name, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, 'CSP',
        b.name_of_society || null, b.address || null,
        b.premiumness || null, b.category || null,
        b.depot_id || null, b.depot_name || null,
        b.locality_id || null, b.locality_name || null,
        b.segment_branch_id || null, b.branch_name || null,
        req.userId,
      ]
    );
    res.json({ success: true, id, message: 'CSP record created successfully.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// ── updateCSP — PUT /api/segment/csp/:id ─────────────────────────
async function updateCSP(req, res) {
  try {
    const { id } = req.params;
    const b = req.body;
    await db.query(
      `UPDATE CRMRMD.segments
       SET name_of_society = ?, address = ?, premiumness = ?, category = ?,
           depot_id = ?, depot_name = ?, locality_id = ?, locality_name = ?,
           segment_branch_id = ?, branch_name = ?
       WHERE id = ?`,
      [
        b.name_of_society || null, b.address || null,
        b.premiumness || null, b.category || null,
        b.depot_id || null, b.depot_name || null,
        b.locality_id || null, b.locality_name || null,
        b.segment_branch_id || null, b.branch_name || null,
        id,
      ]
    );
    res.json({ success: true, message: 'CSP record updated successfully.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// ── getCSPById — GET /api/segment/csp/:id ────────────────────────
async function getCSPById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM CRMRMD.segments WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Record not found.' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

// ── searchLocalities — GET /api/segment/search-OneApp.localities?q=... ───
// Source: CRMRMD.territory (all non-DEPOT types: AREA, CITY, etc.)
async function searchLocalities(req, res) {
  try {
    const q = req.query.q || '';
    if (q.length < 2) return res.json([]);
    const sw = `%${q}%`;
    const [rows] = await db.query(
      `SELECT CAST(territory_id AS CHAR) AS id,
              territory_name AS name,
              territory_type AS type,
              branch_id
       FROM CRMRMD.territory
       WHERE territory_name LIKE ?
         AND territory_type != 'DEPOT'
       ORDER BY territory_name
       LIMIT 20`,
      [sw]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

module.exports = {
  displayMasterComponent,
  displaySegmentsRWA,
  displaySegmentsOOH,
  displaySegmentsCSP,
  displaySegmentsDEPO,
  getSegmentContacts,
  getSegmentContactVendor,
  saveSegmentContacts,
  saveTransDetail,
  getTDPicklistValues,
  getTypes,
  getNeswpaperPicklist,
  getTransDetails,
  viewTransactionDetails,
  viewTransactionDetailsSecondTime,
  createRWA,
  updateRWA,
  getRWAById,
  createOOH,
  updateOOH,
  getOOHById,
  createCSP,
  updateCSP,
  getCSPById,
  searchDepots,
  searchLocalities,
};
