/**
 * Converted from Apex:
 *   GeolocationController.cls
 *   SegmentControllerCSP.cls (checkIn/checkOut/txn methods)
 *   SegmentControllerOOH.cls (checkIn/checkOut/txn methods)
 *
 * All SOQL → MySQL. Haversine distance replaces Salesforce Location API.
 */
const db = require('../config/database');
const { haversineMetres, getLocationName } = require('../utils/geo');

const ALLOWED_RANGE = () => parseInt(process.env.CHECK_IN_ALLOWED_RANGE_METERS || '100');

// Strip well-known prefixes before storing in CRMRMD
const cleanRecordId = (id) => (id || '').replace(/^depot-/i, '');
const cleanUserId   = (id) => (id || '').replace(/^user-/i,  '');

// ── erroLogCreate ──────────────────────────────────────────────────
async function erroLogCreate(req, res) {
  const { recordId, mobId, deviceNM } = req.body;
  const userId = req.userId;
  await db.query(
    `INSERT INTO OneApp.error_logs (function_name, reference_id, message, object_name,
      error_operation, message_description, user_id)
     VALUES ('Check IN', ?, 'Device Id Not Found', 'Device Not Register',
             'Device Not Register', ?, ?)`,
    [userId, `Depot Id - ${recordId} Mobile Id - ${mobId} Device - ${deviceNM}`, userId]
  );
  res.json('Success');
}

// ── validateDepoCheckInToday ───────────────────────────────────────
// Returns: { status: 'can_check_in' | 'checked_in' | 'day_complete', checkInTime, checkOutTime }
async function validateDepoCheckInToday(req, res) {
  const { recordIdDepo } = req.query;
  const userId = req.userId;
  try {
    const usrId  = cleanUserId(userId);
    const recId  = cleanRecordId(recordIdDepo);
    const [rows] = await db.query(
      `SELECT id, check_in_time, check_out_time FROM CRMRMD.check_in_out
       WHERE user_ids = ? AND record_id = ? AND DATE(check_in_time) = CURDATE()
       ORDER BY check_in_time DESC LIMIT 1`,
      [usrId, recId]
    );
    if (rows.length === 0) {
      return res.json({ status: 'can_check_in', checkInTime: null, checkOutTime: null });
    }
    const row = rows[0];
    if (row.check_out_time === null) {
      return res.json({ status: 'checked_in', checkInTime: row.check_in_time, checkOutTime: null });
    }
    return res.json({ status: 'day_complete', checkInTime: row.check_in_time, checkOutTime: row.check_out_time });
  } catch (e) {
    await _logError('validateDepoCheckInToday', userId, e.message);
    res.json({ status: 'can_check_in', checkInTime: null, checkOutTime: null });
  }
}

// ── validateCheckInToday ───────────────────────────────────────────
async function validateCheckInToday(req, res) {
  const { recordId } = req.query;
  const userId = req.userId;
  const [rows] = await db.query(
    `SELECT id FROM OneApp.check_ins
     WHERE segment_id = ?
       AND created_by_id = ?
       AND DATE(created_at) = CURDATE()
       AND check_out_lng IS NULL
       AND check_out_lat IS NULL
       AND check_out_time IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [recordId, userId]
  );
  res.json(rows.length === 0);
}

// Fetches depot geo from CRMRMD.territory. geo_location stored as "lat,lng".
async function _getDepotGeo(territoryId) {
  const [rows] = await db.query(
    'SELECT territory_id, territory_name, geo_location FROM CRMRMD.territory WHERE territory_id = ? AND is_active = 1 LIMIT 1',
    [territoryId]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  let depoLat = null, depoLng = null;
  if (row.geo_location) {
    const parts = row.geo_location.split(',');
    depoLat = parseFloat(parts[0]);
    depoLng = parseFloat(parts[1]);
  }
  return { ...row, depoLat, depoLng };
}

// ── checkOutFromOneAppDepot ────────────────────────────────────────
async function checkOutFromOneAppDepot(req, res) {
  const { lat, lng, recordId, userIds } = req.body;
  const userId = req.userId || userIds;
  const recId  = cleanRecordId(recordId);
  const usrId  = cleanUserId(userId);
  try {
    // Validate depot exists and get geo from CRMRMD.territory
    const depot = await _getDepotGeo(recordId);
    if (!depot) {
      return res.json({ success: false, message: 'Depot record not found.' });
    }

    // Find open check-in
    const [checkIns] = await db.query(
      `SELECT id FROM CRMRMD.check_in_out
       WHERE record_id = ? AND user_ids = ?
         AND DATE(check_in_time) = CURDATE()
         AND check_out_time IS NULL
       ORDER BY check_in_time DESC LIMIT 1`,
      [recId, usrId]
    );
    if (checkIns.length === 0) {
      return res.json({ success: false, message: 'No active check-in found for today.' });
    }

    // 100m validation is mandatory — depot must have geo_location configured
    if (depot.depoLat == null || depot.depoLng == null) {
      return res.json({ success: false, message: 'Depot location not configured. Please contact your administrator.' });
    }
    const distCo  = Math.round(haversineMetres(lat, lng, depot.depoLat, depot.depoLng));
    const allowed = ALLOWED_RANGE();
    if (distCo > allowed) {
      return res.json({ success: false, message: `You are ${distCo}m from the depot. You must be within ${allowed}m to check out.` });
    }

    await db.query(
      `UPDATE CRMRMD.check_in_out
       SET check_out_lat = ?, check_out_lng = ?, check_out_time = NOW()
       WHERE id = ?`,
      [lat, lng, checkIns[0].id]
    );

    res.json({ success: true, message: 'Check Out recorded successfully.' });
  } catch (e) {
    await _logError('Check OUT Depot', userId, e.message);
    res.json({ success: false, message: `Check Out failed: ${e.message}` });
  }
}

// ── checkOutFromOneApp (RWA/CSP/OOH) ──────────────────────────────
async function checkOutFromOneApp(req, res) {
  const { lat, lng, recordId } = req.body;
  const userId = req.userId;
  const locName = await getLocationName(lat, lng);

  const [checkIns] = await db.query(
    `SELECT id FROM OneApp.check_ins
     WHERE segment_id = ? AND created_by_id = ?
       AND DATE(created_at) = CURDATE()
       AND check_out_lat IS NULL AND check_out_lng IS NULL AND check_out_time IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [recordId, userId]
  );
  if (checkIns.length > 0) {
    await db.query(
      `UPDATE OneApp.check_ins SET check_out_lat = ?, check_out_lng = ?,
       check_out_time = NOW(), check_out_location_name = ? WHERE id = ?`,
      [lat, lng, locName, checkIns[0].id]
    );
  }
  res.json('Check Out Success');
}

// ── checkInFromOneAppForDepo ───────────────────────────────────────
async function checkInFromOneAppForDepo(req, res) {
  const { lat, lng, recordId, recordTypeCheckin, mobId, deviceNM, userIds } = req.body;
  const userId = req.userId || userIds;
  const recId  = cleanRecordId(recordId);
  const usrId  = cleanUserId(userId);
  try {
    if (!lat || !lng || !recordId) {
      return res.json({ success: false, message: 'Missing required fields: lat, lng, recordId.' });
    }

    // Validate depot exists and get geo from CRMRMD.territory
    const depot = await _getDepotGeo(recordId);
    if (!depot) {
      return res.json({ success: false, message: `Depot not found: ${recordId}` });
    }

    // ONE check-in per day per user PER DEPOT (users can check into different depots)
    const [anyToday] = await db.query(
      `SELECT id, check_out_time FROM CRMRMD.check_in_out
       WHERE user_ids = ? AND record_id = ? AND DATE(check_in_time) = CURDATE()
       LIMIT 1`,
      [usrId, recId]
    );
    if (anyToday.length > 0) {
      const msg = anyToday[0].check_out_time === null
        ? 'You are already checked in at this depot. Please check out before checking in again.'
        : "You have already completed today's visit at this depot.";
      return res.json({ success: false, message: msg });
    }

    // 100m validation is mandatory — depot must have geo_location configured
    if (depot.depoLat == null || depot.depoLng == null) {
      return res.json({ success: false, message: 'Depot location not configured. Please contact your administrator.' });
    }
    const distMetres = Math.round(haversineMetres(lat, lng, depot.depoLat, depot.depoLng));
    const allowed    = ALLOWED_RANGE();
    if (distMetres > allowed) {
      return res.json({
        success: false,
        message: `You are ${distMetres}m from the depot. You must be within ${allowed}m to check in.`,
      });
    }

    const [result] = await db.query(
      `INSERT INTO CRMRMD.check_in_out
         (record_id, record_type_checkin, user_ids, mob_id, device_nm,
          check_in_lat, check_in_lng, check_in_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [recId, recordTypeCheckin || 'DEPO', usrId, mobId || null, deviceNM || null, lat, lng]
    );

    if (result.affectedRows === 0) {
      return res.json({ success: false, message: 'Failed to save check-in. Please try again.' });
    }

    await _updateUserMobileId(userId, mobId);

    const distMsg = distMetres !== null ? ` (${distMetres}m from depot)` : '';
    res.json({ success: true, message: `Check In recorded successfully${distMsg}.` });

  } catch (e) {
    await _logError('Check IN Depot', userId, e.message);
    res.json({ success: false, message: `Check In failed: ${e.message}` });
  }
}

// ── checkInFromOneApp (RWA/CSP/OOH) ───────────────────────────────
async function checkInFromOneApp(req, res) {
  const { lat, lng, recordId, recordTypeCheckin } = req.body;
  const userId = req.userId;
  const locName = await getLocationName(lat, lng);

  if (recordTypeCheckin) {
    // Update segment pending approval location
    await db.query(
      `UPDATE segments
       SET pending_approval_lat = ?, pending_approval_lng = ?,
           check_in_location_name = ?
       WHERE id = ? AND location_approval_status != 'Approved'`,
      [lat, lng, locName, recordId]
    );
    return res.json('Check In Success');
  }

  await db.query(
    `INSERT INTO OneApp.check_ins
     (check_in_location_lat, check_in_location_lng, segment_id,
      check_in_location_name, check_in_user_id, created_by_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [lat, lng, recordId, locName, userId, userId]
  );
  res.json('Check In Success');
}

// ── checkInSecondTime ──────────────────────────────────────────────
async function checkInSecondTime(req, res) {
  const { lat, lng, recordId, recordTypeCheckin } = req.body;
  const userId = req.userId;
  const locName = await getLocationName(lat, lng);

  await db.query(
    `INSERT INTO OneApp.check_ins
     (check_in_location_lat, check_in_location_lng, segment_id,
      check_in_location_name, check_in_user_id, created_by_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [lat, lng, recordId, locName, userId, userId]
  );

  const [segRows] = await db.query(
    'SELECT id, approved_geolocation_lat, approved_geolocation_lng FROM OneApp.segments WHERE id = ?',
    [recordId]
  );
  if (segRows.length === 0) return res.json('success');
  const seg = segRows[0];

  if (seg.approved_geolocation_lat != null) {
    const dist = haversineMetres(lat, lng, seg.approved_geolocation_lat, seg.approved_geolocation_lng);
    if (dist <= 2000) return res.json('success');
    return res.json('fail');
  }

  await db.query(
    'UPDATE OneApp.segments SET pending_approval_lat = ?, pending_approval_lng = ? WHERE id = ?',
    [lat, lng, recordId]
  );
  res.json('success');
}

// ── addedNonMandatoryNewspaper ─────────────────────────────────────
async function addedNonMandatoryNewspaper(req, res) {
  const { lat, lng, recordId, stList } = req.body;
  const userId = req.userId;

  await db.query(
    `INSERT INTO OneApp.check_ins (check_in_location_lat, check_in_location_lng, created_by_id)
     VALUES (?, ?, ?)`,
    [lat, lng, userId]
  );

  if (Array.isArray(stList) && stList.length > 0) {
    const rows = stList.map(s => [parseFloat(s.FTDCount || 0), s.newsPaper, s.sId]);
    await db.query(
      'INSERT INTO OneApp.transactional_details (ftd_count, name, segment_id) VALUES ?',
      [rows]
    );
  }
  res.json('success');
}

// ── txnVisitSave ───────────────────────────────────────────────────
async function txnVisitSave(req, res) {
  const { segmentId, selectedRow } = req.body;

  const [segRows] = await db.query(
    'SELECT id, last_check_in_date FROM OneApp.segments WHERE id = ? LIMIT 1',
    [segmentId]
  );
  if (segRows.length === 0) return res.json({});

  if (Array.isArray(selectedRow) && selectedRow.length > 0) {
    const today = new Date();
    const inserts = selectedRow.map(st => [
      st.name,
      segmentId,
      st.ftdcount || 0,
      today,
      st.ftdcount || 0,
    ]);
    await db.query(
      `INSERT INTO OneApp.transactional_details
       (name, segment_id, ftd_count, check_in_date, last_visit)
       VALUES ?`,
      [inserts]
    );
    await db.query('UPDATE OneApp.segments SET last_check_in_date = CURDATE() WHERE id = ?', [segmentId]);
  }
  res.json({ lastVisit: null, covidCheck: false });
}

// ── insertTransactionDetails ───────────────────────────────────────
async function insertTransactionDetails(req, res) {
  const { recordId } = req.body;
  const [rows] = await db.query(
    'SELECT id, name, last_visit, second_last_visit, segment_id, ftd_count FROM OneApp.transactional_details WHERE segment_id = ?',
    [recordId]
  );
  res.json(rows);
}

// ── validateSegmentCheckIn (RWA / OOH / CSP) ──────────────────────
// Returns: { status: 'can_check_in' | 'checked_in' | 'day_complete', checkInTime, checkOutTime }
async function validateSegmentCheckIn(req, res) {
  const { recordId } = req.query;
  const usrId = cleanUserId(req.userId);
  try {
    const [rows] = await db.query(
      `SELECT id, check_in_time, check_out_time FROM CRMRMD.check_in_out
       WHERE record_id = ? AND user_ids = ? AND DATE(check_in_time) = CURDATE()
       ORDER BY check_in_time DESC LIMIT 1`,
      [recordId, usrId]
    );
    if (rows.length === 0)
      return res.json({ status: 'can_check_in', checkInTime: null, checkOutTime: null });
    const row = rows[0];
    if (row.check_out_time === null)
      return res.json({ status: 'checked_in', checkInTime: row.check_in_time, checkOutTime: null });
    return res.json({ status: 'day_complete', checkInTime: row.check_in_time, checkOutTime: row.check_out_time });
  } catch (e) {
    res.json({ status: 'can_check_in', checkInTime: null, checkOutTime: null });
  }
}

// ── checkInSegment (RWA / OOH / CSP) ──────────────────────────────
async function checkInSegment(req, res) {
  const { lat, lng, recordId, segType, mobId, deviceNM } = req.body;
  const usrId = cleanUserId(req.userId);
  try {
    const [existing] = await db.query(
      `SELECT id, check_out_time FROM CRMRMD.check_in_out
       WHERE record_id = ? AND user_ids = ? AND DATE(check_in_time) = CURDATE()
       LIMIT 1`,
      [recordId, usrId]
    );
    if (existing.length > 0) {
      const msg = existing[0].check_out_time === null
        ? 'You are already checked in. Please check out first.'
        : "Today's visit is already complete for this record.";
      return res.json({ success: false, message: msg });
    }
    await db.query(
      `INSERT INTO CRMRMD.check_in_out
         (record_id, record_type_checkin, user_ids, mob_id, device_nm,
          check_in_lat, check_in_lng, check_in_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [recordId, segType || 'RWA', usrId, mobId || null, deviceNM || null, lat, lng]
    );
    res.json({ success: true, message: 'Check In recorded successfully.' });
  } catch (e) {
    res.json({ success: false, message: `Check In failed: ${e.message}` });
  }
}

// ── checkOutSegment (RWA / OOH / CSP) ──────────────────────────────
async function checkOutSegment(req, res) {
  const { lat, lng, recordId } = req.body;
  const usrId = cleanUserId(req.userId);
  try {
    const [checkIns] = await db.query(
      `SELECT id FROM CRMRMD.check_in_out
       WHERE record_id = ? AND user_ids = ? AND DATE(check_in_time) = CURDATE()
         AND check_out_time IS NULL
       ORDER BY check_in_time DESC LIMIT 1`,
      [recordId, usrId]
    );
    if (checkIns.length === 0)
      return res.json({ success: false, message: 'No active check-in found for today.' });
    await db.query(
      `UPDATE CRMRMD.check_in_out
       SET check_out_lat = ?, check_out_lng = ?, check_out_time = NOW()
       WHERE id = ?`,
      [lat, lng, checkIns[0].id]
    );
    res.json({ success: true, message: 'Check Out recorded successfully.' });
  } catch (e) {
    res.json({ success: false, message: `Check Out failed: ${e.message}` });
  }
}

// ── Helpers ────────────────────────────────────────────────────────
async function _logError(fnName, refId, msg) {
  try {
    await db.query(
      `INSERT INTO OneApp.error_logs (function_name, reference_id, message) VALUES (?, ?, ?)`,
      [fnName, refId, msg]
    );
  } catch {}
}

async function _updateUserMobileId(userId, mobId) {
  if (!mobId) return;
  const [rows] = await db.query('SELECT mobile_id FROM CRMRMD.users WHERE id = ?', [userId]);
  if (rows.length > 0 && !rows[0].mobile_id) {
    await db.query('UPDATE CRMRMD.users SET mobile_id = ? WHERE id = ?', [mobId, userId]);
  }
}

module.exports = {
  erroLogCreate,
  validateDepoCheckInToday,
  validateCheckInToday,
  checkOutFromOneAppDepot,
  checkOutFromOneApp,
  checkInFromOneAppForDepo,
  checkInFromOneApp,
  checkInSecondTime,
  addedNonMandatoryNewspaper,
  txnVisitSave,
  insertTransactionDetails,
  validateSegmentCheckIn,
  checkInSegment,
  checkOutSegment,
};
