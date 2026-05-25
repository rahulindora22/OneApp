/**
 * OneApp REST API client — points to the Node.js backend (TOISFDC/API).
 * Replace BASE_URL with your server address or AWS ALB/API Gateway URL.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use LAN IP so physical devices can reach the API server over Wi-Fi.
// Change to http://localhost:3001/api when testing on iOS Simulator only.
const BASE_URL = 'http://192.168.29.218:3001/api';

// Registered by AuthContext — called automatically on any 401 response.
let _unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) { _unauthorizedHandler = fn; }

async function getToken() {
  return await AsyncStorage.getItem('access_token');
}

async function request(method, path, body, params) {
  const token = await getToken();
  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += '?' + qs;
  }
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401 && _unauthorizedHandler) {
      _unauthorizedHandler();
    }
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

const get  = (path, params) => request('GET',  path, null, params);
const post = (path, body)   => request('POST', path, body);
const put  = (path, body)   => request('PUT',  path, body);

// ── Auth ──────────────────────────────────────────────────────────
export async function login(username, password) {
  const data = await post('/auth/login', { username, password });
  await AsyncStorage.setItem('access_token', data.access_token);
  await AsyncStorage.setItem('user_id', data.user_id);
  await AsyncStorage.setItem('user_name', data.name);
  return data;
}

export async function logout() {
  await AsyncStorage.multiRemove(['access_token', 'user_id', 'user_name']);
}

export async function getUserId() {
  return await AsyncStorage.getItem('user_id');
}

// ── Segment ───────────────────────────────────────────────────────
export const displayMasterComponent = () =>
  get('/segment/master-component');

export const displaySegmentsRWA = (searchkey) =>
  get('/segment/rwa', { searchkey });

export const getRWAById      = (id)      => get(`/segment/rwa/${id}`);
export const createSegmentRWA = (payload) => post('/segment/rwa', payload);
export const updateSegmentRWA = (id, payload) =>
  put(`/segment/rwa/${id}`, payload);
export const searchDepots      = (q) => get('/segment/search-depots', { q });
export const searchLocalities  = (q) => get('/segment/search-localities', { q });

export const displaySegmentsOOH = (searchkey) =>
  get('/segment/ooh', { searchkey });

export const createSegmentOOH  = (payload)     => post('/segment/ooh', payload);
export const updateSegmentOOH  = (id, payload) => put(`/segment/ooh/${id}`, payload);
export const getOOHById        = (id)           => get(`/segment/ooh/${id}`);

export const displaySegmentsCSP = (searchkey) =>
  get('/segment/csp', { searchkey });

export const createSegmentCSP  = (payload)     => post('/segment/csp', payload);
export const updateSegmentCSP  = (id, payload) => put(`/segment/csp/${id}`, payload);
export const getCSPById        = (id)           => get(`/segment/csp/${id}`);

export const displaySegmentsDEPO = () =>
  get('/segment/depo');

export const getSegmentContacts = (segmentId) =>
  get('/segment/contacts', { segmentId });

export const getSegmentContactVendor = (segmentId) =>
  get('/segment/vendors', { segmentId });

export const saveSegmentContact = (payload) =>
  post('/segment/contacts', payload);

export const saveTransDetail = (tssList) =>
  post('/segment/trans-detail', { tssList });

export const getTDPicklistValues = () =>
  get('/segment/picklist-values');

export const getTypes = () =>
  get('/segment/types');

export const getNeswpaperPicklist = (recordId) =>
  get('/segment/newspaper-picklist', { recordId });

export const getTransDetails = (segmentId) =>
  get('/segment/trans-details', { segmentId });

export const viewTransactionDetails = (recordId) =>
  get('/segment/transactions', { recordId });

export const viewTransactionDetailsSecondTime = (recordId, segType = 'RWA') =>
  get('/segment/transactions-second', { recordId, segType });

// ── Telecaller Assignment ─────────────────────────────────────────
export const searchTelecallerAssignments = (q, campaign_id) =>
  get('/telecaller-assignment', { ...(q ? { q } : {}), ...(campaign_id ? { campaign_id } : {}) });
export const getTelecallerAssignmentById = (id)          => get(`/telecaller-assignment/${id}`);
export const createTelecallerAssignment  = (payload)     => post('/telecaller-assignment', payload);
export const updateTelecallerAssignment  = (id, payload) => put(`/telecaller-assignment/${id}`, payload);
export const searchTelecallerUsers       = (q)           => get('/telecaller-assignment/users', q ? { q } : {});

// ── Promotion Lead ────────────────────────────────────────────────
export const searchPromotionLeads   = (q, campaign_id) => get('/promotion-lead', { ...(q ? { q } : {}), ...(campaign_id ? { campaign_id } : {}) });
export const getPromotionLeadById   = (id)             => get(`/promotion-lead/${id}`);
export const createPromotionLead    = (payload)        => post('/promotion-lead', payload);
export const updatePromotionLead    = (id, payload)    => put(`/promotion-lead/${id}`, payload);
export const bulkInsertPromotionLeads = (payload)      => post('/promotion-lead/bulk', payload);

// ── Campaign ──────────────────────────────────────────────────────
export const searchCampaigns    = (q)           => get('/campaign', q ? { q } : {});
export const getCampaignById    = (id)          => get(`/campaign/${id}`);
export const createCampaign     = (payload)     => post('/campaign', payload);
export const updateCampaign     = (id, payload) => put(`/campaign/${id}`, payload);
export const addCampaignMember         = (payload)     => post('/campaign/members', payload);
export const addCampaignMemberWithLead = (payload)     => post('/campaign/members-with-lead', payload);
export const bulkAddCampaignMembers    = (payload)     => post('/campaign/members-bulk', payload);
export const listCampaignNames         = (q)           => get('/campaign/names', q ? { q } : {});
export const syncCampaign              = (id)          => post(`/campaign/${id}/sync`);
export const syncTelecallers           = (id)          => post(`/campaign/${id}/sync-telecallers`);
export const syncCampaignMembers       = (id)          => post(`/campaign/${id}/sync-members`);
export const getCTIStatus              = (id)          => get(`/campaign/${id}/cti-status`);
export const callBatch                 = (id)          => post(`/campaign/${id}/call-batch`);
export const getBatchStatus            = (campaignId, batchId) => get(`/campaign/${campaignId}/batch/${batchId}`);

// -- Templates -------------------------------------------------------------------
export const listSmsTemplates    = ()            => get('/templates/sms');
export const createSmsTemplate   = (payload)     => post('/templates/sms', payload);
export const updateSmsTemplate   = (id, payload) => put(`/templates/sms/${id}`, payload);
export const listEmailTemplates  = ()            => get('/templates/email');
export const createEmailTemplate = (payload)     => post('/templates/email', payload);
export const updateEmailTemplate = (id, payload) => put(`/templates/email/${id}`, payload);
export const getBatchLogs        = (campaignId)  => get('/templates/batch-logs', campaignId ? { campaign_id: campaignId } : {});

// ── Lead ──────────────────────────────────────────────────────────
export const searchLeads   = (q)           => get('/lead', q ? { q } : {});
export const getLeadById   = (id)          => get(`/lead/${id}`);
export const createLead    = (payload)     => post('/lead', payload);
export const updateLead    = (id, payload) => put(`/lead/${id}`, payload);

// ── User Roles ────────────────────────────────────────────────────
export const listUserRoles         = (params)     => get('/user-roles', params);
export const getUserRoleById       = (id)         => get(`/user-roles/${id}`);
export const createUserRole        = (payload)    => post('/user-roles', payload);
export const updateUserRole        = (id, payload)=> put(`/user-roles/${id}`, payload);
export const getUserRoleTypes      = ()           => get('/user-roles/types');
export const searchUserRoleUsers   = (q)          => get('/user-roles/search-users', q ? { q } : {});
export const searchUserRoleTerritories = (q, type) =>
  get('/user-roles/search-territories', { ...(q ? { q } : {}), ...(type ? { type } : {}) });

// ── Geolocation ───────────────────────────────────────────────────
export const erroLogCreate = (payload) =>
  post('/geo/error-log', payload);

export const validateDepoCheckInToday = (recordIdDepo) =>
  get('/geo/validate-depo-checkin', { recordIdDepo });

export const validateCheckInToday = (recordId) =>
  get('/geo/validate-checkin', { recordId });

export const checkOutFromOneAppDepot = (payload) =>
  post('/geo/checkout-depo', payload);

export const checkOutFromOneApp = (payload) =>
  post('/geo/checkout', payload);

export const checkInFromOneAppForDepo = (payload) =>
  post('/geo/checkin-depo', payload);

export const checkInFromOneApp = (payload) =>
  post('/geo/checkin', payload);

export const checkInSecondTime = (payload) =>
  post('/geo/checkin-second', payload);

export const addedNonMandatoryNewspaper = (payload) =>
  post('/geo/add-newspaper', payload);

export const txnVisitSave = (payload) =>
  post('/geo/txn-visit-save', payload);

export const insertTransactionDetails = (recordId) =>
  post('/geo/insert-transactions', { recordId });

// ── Segment Check-In / Check-Out (RWA / OOH / CSP) ───────────────
export const validateSegmentCheckIn = (recordId) =>
  get('/geo/validate-segment-checkin', { recordId });

export const checkInSegment  = (payload) => post('/geo/checkin-segment',  payload);
export const checkOutSegment = (payload) => post('/geo/checkout-segment', payload);
