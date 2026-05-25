import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your Salesforce org URL and Connected App credentials
const SF_BASE_URL = 'https://YOUR_ORG.salesforce.com';
const CLIENT_ID = 'YOUR_CONNECTED_APP_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CONNECTED_APP_CLIENT_SECRET';

async function getAccessToken() {
  return await AsyncStorage.getItem('sf_access_token');
}

async function getInstanceUrl() {
  return await AsyncStorage.getItem('sf_instance_url');
}

export async function sfLogin(username, password) {
  const url = `${SF_BASE_URL}/services/oauth2/token`;
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('username', username);
  params.append('password', password);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();

  await AsyncStorage.setItem('sf_access_token', data.access_token);
  await AsyncStorage.setItem('sf_instance_url', data.instance_url);
  await AsyncStorage.setItem('sf_user_id', data.id.split('/').pop());

  return data;
}

export async function sfLogout() {
  await AsyncStorage.multiRemove(['sf_access_token', 'sf_instance_url', 'sf_user_id']);
}

async function apexGet(path, params = {}) {
  const token = await getAccessToken();
  const instanceUrl = await getInstanceUrl();
  const query = new URLSearchParams(params).toString();
  const url = `${instanceUrl}/services/apexrest${path}${query ? '?' + query : ''}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err[0]?.message || 'API error');
  }
  return res.json();
}

async function apexPost(path, body = {}) {
  const token = await getAccessToken();
  const instanceUrl = await getInstanceUrl();
  const url = `${instanceUrl}/services/apexrest${path}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err[0]?.message || 'API error');
  }
  return res.json();
}

// ── SegmentController ──────────────────────────────────────────────
export const displayMasterComponent = (userID) =>
  apexGet('/SegmentController/displayMasterComponent', { userID });

export const displaySegmentsRWA = (searchkey) =>
  apexGet('/SegmentController/displaySegmentsRWA', { searchkey });

export const displaySegmentsOOH = (searchkey) =>
  apexGet('/SegmentController/displaySegmentsOOH', { searchkey });

export const displaySegmentsCSP = (searchkey) =>
  apexGet('/SegmentController/displaySegmentsCSP', { searchkey });

export const displaySegmentsDEPO = (userId) =>
  apexGet('/SegmentController/displaySegmentsDEPO', { Id: userId });

export const getSegmentContacts = (segmentId) =>
  apexGet('/SegmentController/getSegmentContacts', { segmentIdforSegContacts: segmentId });

export const getSegmentContactVendor = (segmentId) =>
  apexGet('/SegmentController/getSegmentContactVendor', { segmentIdforSegCntcts: segmentId });

export const saveSegmentContacts = (accList) =>
  apexPost('/SegmentController/saveSegmentContacts', { accList });

export const saveTransDetail = (tssList) =>
  apexPost('/SegmentController/saveTransDetail', { tssList });

export const getTypes = () =>
  apexGet('/SegmentController/getTypes');

export const getTDPicklistValues = () =>
  apexGet('/SegmentController/getTDPicklistValues');

export const recordTypeRWA = () =>
  apexGet('/SegmentController/recordTypeRWA');

export const recordTypeOOH = () =>
  apexGet('/SegmentController/recordTypeOOH');

export const recordTypeCSP = () =>
  apexGet('/SegmentController/recordTypeCSP');

export const recordTypeSegmentContact = () =>
  apexGet('/SegmentController/recordTypeSegmentContact');

export const recordTypeSegmentContactVendor = () =>
  apexGet('/SegmentController/recordTypeSegmentContactVendor');

// ── GeolocationController ──────────────────────────────────────────
export const checkInFromOneApp = (payload) =>
  apexPost('/GeolocationController/checkInFromOneApp', payload);

export const checkInFromOneAppForDepo = (payload) =>
  apexPost('/GeolocationController/checkInFromOneAppForDepo', payload);

export const checkOutFromOneAppDepot = (payload) =>
  apexPost('/GeolocationController/checkOutFromOneAppDepot', payload);

export const validateDepoCheckInToday = (recordIdDepo) =>
  apexGet('/GeolocationController/validateDepoCheckInToday', { recordIdDepo });

export const checkInSecondTime = (payload) =>
  apexPost('/GeolocationController/checkInSecondTime', payload);

export const checkOutFromOneApp = (payload) =>
  apexPost('/GeolocationController/checkOutFromOneApp', payload);

export const insertTransactionDetails = (recordId) =>
  apexPost('/GeolocationController/insertTransactionDetails', { recordId });

export const viewTransactionDetails = (recordId) =>
  apexGet('/GeolocationController/viewTransactionDetails', { recordId });

export const viewTransactionDetailsSecondTime = (recordId) =>
  apexGet('/GeolocationController/viewTransactionDetailsSecondTime', { recordId });

export const erroLogCreate = (payload) =>
  apexPost('/GeolocationController/erroLogCreate', payload);

// ── SegmentControllerCSP / OOH ─────────────────────────────────────
export const viewTransactionDetailsCSP = (recordId) =>
  apexGet('/SegmentControllerCSP/viewTransactionDetails', { recordId });

export const viewTransactionDetailsOOH = (recordId) =>
  apexGet('/SegmentControllerOOH/viewTransactionDetails', { recordId });
