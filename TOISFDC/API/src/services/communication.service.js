/**
 * Communication Service — WhatsApp, SMS (TIL + IMIMOBILE fallback), Email
 * Translated from Salesforce Apex: RMDCampaignPromotationLeadNewCustomer
 */
const axios     = require('axios');
const nodemailer = require('nodemailer');

// ── Template variable substitution ────────────────────────────────────
// Replaces {#var1#} ... {#var5#} in template body — mirrors Apex replace logic
function substituteVars(text, vars = {}) {
  if (!text) return text || '';
  let result = text;
  const map = {
    '{#var1#}': vars.var1,
    '{#var2#}': vars.var2,
    '{#var3#}': vars.var3,
    '{#var4#}': vars.var4,
    '{#var5#}': vars.var5,
  };
  for (const [placeholder, value] of Object.entries(map)) {
    if (value != null && value !== '') {
      result = result.split(placeholder).join(String(value));
    }
  }
  return result;
}

// ── WhatsApp via Webex Connect ─────────────────────────────────────────
// Mirrors: sendThroughWhatsAppNotFuture()
async function sendWhatsApp(mobile, templateName, vars = {}) {
  const params = {
    MSISDN:       '91' + mobile,
    templatename: templateName,
  };
  if (vars.var1) params.Var1 = vars.var1;
  if (vars.var2) params.Var2 = vars.var2;
  if (vars.var3) params.Var3 = vars.var3;
  if (vars.var4) params.Var4 = vars.var4;
  if (vars.var5) params.Var5 = vars.var5;

  const payload = {
    events: [{ evtid: 4792, correlationid: 'ABC123', parameters: params }],
    notifyurl: '',
  };

  const endpoint = process.env.WHATSAPP_ENDPOINT
    || 'https://api.in.webexconnect.io/resources/v1/events/externalevent/';
  const apiKey = process.env.WHATSAPP_API_KEY
    || '582f56bf-629c-11ee-aa68-0aed5d0b54c2';

  const res = await axios.post(endpoint, payload, {
    headers: { 'Content-Type': 'application/json', key: apiKey },
    timeout: 15000,
  });
  return res.data;
}

// ── SMS via TIL (primary provider) ────────────────────────────────────
// Mirrors: sendThroughSMSNotFuture() → url2 / GET flow
async function sendSMSTIL(mobile, smsBody, dltContentId) {
  const encoded  = encodeURIComponent(smsBody).replace(/%5Cr%5Cn/gi, '%0A');
  const username = process.env.SMS_TIL_USERNAME  || 'rmdbcclsurveytrans.trans';
  const password = process.env.SMS_TIL_PASSWORD  || '4IVzy';
  const sender   = process.env.SMS_TIL_SENDER    || 'TOICRM';
  const baseUrl  = process.env.SMS_TIL_URL       || 'https://api.oot.bz/api/v1/send';

  const url = `${baseUrl}?username=${username}&password=${password}&unicode=true&from=${sender}&to=${mobile}&text=${encoded}&dltContentId=${dltContentId}`;

  const res = await axios.get(url, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });
  // Expected: { state: 'SUBMIT_ACCEPTED', transactionId, description }
  return res.data;
}

// ── SMS via IMIMOBILE (fallback provider) ─────────────────────────────
// Mirrors: sendThroughSMSNotFuture() → checkUseIMIAPI = true branch
async function sendSMSIMIMobile(mobile, smsBody, dltContentId) {
  const endpoint = process.env.IMIMOBILE_ENDPOINT;
  const apiKey   = process.env.IMIMOBILE_API_KEY || '701d939b-2d0a-11ee-aa68-0aed5d0b54c2';

  if (!endpoint) throw new Error('IMIMOBILE_ENDPOINT not configured in .env');

  const payload = {
    deliverychannel: 'sms',
    channels: {
      sms: {
        text:     smsBody,
        senderid: process.env.SMS_TIL_SENDER || 'TOICRM',
        type:     'unicode',
        extras:   { dlt_templateid: dltContentId },
      },
    },
    destination: [{ msisdn: [mobile], correlationid: 'transid' }],
  };

  const res = await axios.post(endpoint, payload, {
    headers: { 'Content-Type': 'application/json', key: apiKey },
    timeout: 15000,
  });
  return res.data;
}

// ── SMS with TIL → IMIMOBILE fallback ─────────────────────────────────
// Mirrors Apex counter logic: try TIL, if SUBMIT_ACCEPTED ok, else IMIMOBILE
async function sendSMS(mobile, smsBody, dltContentId) {
  let tilError = null;
  try {
    const result = await sendSMSTIL(mobile, smsBody, dltContentId);
    if (result?.state === 'SUBMIT_ACCEPTED') {
      return { provider: 'TIL', success: true, result };
    }
    tilError = result?.description || result?.state || 'Not accepted';
  } catch (err) {
    tilError = err.message;
  }

  // TIL failed — try IMIMOBILE fallback
  try {
    const result = await sendSMSIMIMobile(mobile, smsBody, dltContentId);
    return { provider: 'IMIMOBILE', success: true, result };
  } catch (err2) {
    throw new Error(`SMS failed. TIL: ${tilError} | IMIMOBILE: ${err2.message}`);
  }
}

// ── Email via SMTP (nodemailer) ────────────────────────────────────────
// Mirrors: Apex Flow.Interview.RMD_Trigger_email — replaced with SMTP send
let _mailer = null;
function getMailer() {
  if (!_mailer) {
    _mailer = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    });
  }
  return _mailer;
}

async function sendEmail(to, subject, body) {
  const mailer = getMailer();
  const from   = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@timesofindia.com';
  await mailer.sendMail({ from, to, subject, text: body });
  return { success: true };
}

module.exports = { substituteVars, sendWhatsApp, sendSMSTIL, sendSMSIMIMobile, sendSMS, sendEmail };
