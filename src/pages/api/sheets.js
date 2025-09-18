// src/pages/api/sheets.js
export const runtime = 'nodejs';

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const {
  GOOGLE_SA_EMAIL,
  GOOGLE_SA_KEY,        // (opsiyonel) ENV içinde key string (escaped \n'li olabilir)
  GOOGLE_SA_KEY_FILE,   // (opsiyonel) PEM dosyası yolu (örn: ./src/keys/sheets.pem)
  SHEET_ID,
  MODS_SHEET = 'modules',
  META_SHEET = 'meta',
} = process.env;

function loadPrivateKey() {
  // 1) Dosyadan oku (tercih edilen)
  if (GOOGLE_SA_KEY_FILE) {
    const keyPath = path.resolve(process.cwd(), GOOGLE_SA_KEY_FILE);
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Key file not found at ${keyPath}`);
    }
    const pem = fs.readFileSync(keyPath, 'utf8');
    const cleaned = pem.trim();
    if (!cleaned.includes('BEGIN PRIVATE KEY')) {
      throw new Error('Key file exists but does not look like a PEM private key.');
    }
    return cleaned;
  }

  // 2) ENV string (tek satır, \n kaçışlı olabilir)
  if (GOOGLE_SA_KEY && GOOGLE_SA_KEY.trim().length > 0) {
    const fromEnv = GOOGLE_SA_KEY.replace(/\\n/g, '\n').trim();
    if (!fromEnv.includes('BEGIN PRIVATE KEY')) {
      throw new Error('GOOGLE_SA_KEY present but not a PEM string.');
    }
    return fromEnv;
  }

  throw new Error('No key or keyFile set. Provide GOOGLE_SA_KEY_FILE or GOOGLE_SA_KEY.');
}

async function sheetsClient() {
  const key = loadPrivateKey();

  const jwt = new google.auth.JWT({
    email: GOOGLE_SA_EMAIL,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  await jwt.getAccessToken();
  return google.sheets({ version: 'v4', auth: jwt });
}

// === ŞEMA ===
// Aşağıdaki kolonlar bir defa yazılınca sabit kalır.
// id, name, desc, color, docsUrl, deps_json, enabled, isMvp,
// v1: baseDuration_v1, baseFe_v1, baseBe_v1, baseQa_v1, basePm_v1, fe_v1, be_v1, qa_v1, pm_v1, obMode_v1, progress_v1, computedOverride_v1
// v2: ... _v2
// v3: ... _v3

const HEADER = [
  'id','name','desc','color','docsUrl','deps_json','enabled','isMvp',
  // V1
  'baseDuration_v1','baseFe_v1','baseBe_v1','baseQa_v1','basePm_v1',
  'fe_v1','be_v1','qa_v1','pm_v1',
  'obMode_v1','progress_v1','computedOverride_v1',
  // V2
  'baseDuration_v2','baseFe_v2','baseBe_v2','baseQa_v2','basePm_v2',
  'fe_v2','be_v2','qa_v2','pm_v2',
  'obMode_v2','progress_v2','computedOverride_v2',
  // V3
  'baseDuration_v3','baseFe_v3','baseBe_v3','baseQa_v3','basePm_v3',
  'fe_v3','be_v3','qa_v3','pm_v3',
  'obMode_v3','progress_v3','computedOverride_v3',
];

function boolOut(b){ return b ? true : false; }
function numOut(n, def=0){ const v = Number(n); return Number.isFinite(v) ? v : def; }
function safeJson(v){ try { return JSON.stringify(v ?? []); } catch { return '[]'; } }

async function readModules(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${MODS_SHEET}!A1:AZ`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const rows = res.data.values || [];
  if (rows.length <= 1) return [];

  const hdr = rows[0] || [];
  const idx = Object.fromEntries(hdr.map((h, i) => [h, i]));

  function get(r, key, def=''){
    const i = idx[key];
    if (i===undefined) return def;
    return r[i] ?? def;
  }

  const data = rows.slice(1).filter(r => (get(r,'id','') !== ''));

  return data.map(r => ({
    id: Number(get(r,'id')),
    name: get(r,'name',''),
    desc: get(r,'desc',''),
    color: get(r,'color','#999999'),
    docsUrl: get(r,'docsUrl',''),
    deps_json: get(r,'deps_json','[]'),
    enabled: get(r,'enabled',false),
    isMvp:   get(r,'isMvp',false),

    // V1
    baseDuration_v1: get(r,'baseDuration_v1',1),
    baseFe_v1: get(r,'baseFe_v1',0),
    baseBe_v1: get(r,'baseBe_v1',0),
    baseQa_v1: get(r,'baseQa_v1',0),
    basePm_v1: get(r,'basePm_v1',0),
    fe_v1: get(r,'fe_v1',0),
    be_v1: get(r,'be_v1',0),
    qa_v1: get(r,'qa_v1',0),
    pm_v1: get(r,'pm_v1',0),
    obMode_v1: get(r,'obMode_v1','none'),
    progress_v1: get(r,'progress_v1',0),
    computedOverride_v1: get(r,'computedOverride_v1',0),

    // V2
    baseDuration_v2: get(r,'baseDuration_v2',1),
    baseFe_v2: get(r,'baseFe_v2',0),
    baseBe_v2: get(r,'baseBe_v2',0),
    baseQa_v2: get(r,'baseQa_v2',0),
    basePm_v2: get(r,'basePm_v2',0),
    fe_v2: get(r,'fe_v2',0),
    be_v2: get(r,'be_v2',0),
    qa_v2: get(r,'qa_v2',0),
    pm_v2: get(r,'pm_v2',0),
    obMode_v2: get(r,'obMode_v2','none'),
    progress_v2: get(r,'progress_v2',0),
    computedOverride_v2: get(r,'computedOverride_v2',0),

    // V3
    baseDuration_v3: get(r,'baseDuration_v3',1),
    baseFe_v3: get(r,'baseFe_v3',0),
    baseBe_v3: get(r,'baseBe_v3',0),
    baseQa_v3: get(r,'baseQa_v3',0),
    basePm_v3: get(r,'basePm_v3',0),
    fe_v3: get(r,'fe_v3',0),
    be_v3: get(r,'be_v3',0),
    qa_v3: get(r,'qa_v3',0),
    pm_v3: get(r,'pm_v3',0),
    obMode_v3: get(r,'obMode_v3','none'),
    progress_v3: get(r,'progress_v3',0),
    computedOverride_v3: get(r,'computedOverride_v3',0),
  }));
}

async function readMeta(sheets, key) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${META_SHEET}!A1:B`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const rows = res.data.values || [];
  for (const r of rows.slice(1)) if (r[0] === key) return r[1] || '';
  return '';
}

function moduleRowOut(m){
  // state -> sheet row (HEADER sırasına göre)
  const v1 = m.versions?.v1 ?? {};
  const v2 = m.versions?.v2 ?? {};
  const v3 = m.versions?.v3 ?? {};
  return [
    numOut(m.id, 0),
    String(m.name || ''),
    String(m.desc || ''),
    String(m.color || '#999999'),
    String(m.docsUrl || ''),
    safeJson(m.deps || []),
    boolOut(m.enabled),
    boolOut(m.isMvp),

    // V1
    numOut(v1.baseDuration,1), numOut(v1.baseFe,0), numOut(v1.baseBe,0), numOut(v1.baseQa,0), numOut(v1.basePm,0),
    numOut(v1.fe,0), numOut(v1.be,0), numOut(v1.qa,0), numOut(v1.pm,0),
    String(v1.obMode || 'none'),
    numOut(v1.progress,0),
    numOut(v1.computedOverride,0),

    // V2
    numOut(v2.baseDuration,1), numOut(v2.baseFe,0), numOut(v2.baseBe,0), numOut(v2.baseQa,0), numOut(v2.basePm,0),
    numOut(v2.fe,0), numOut(v2.be,0), numOut(v2.qa,0), numOut(v2.pm,0),
    String(v2.obMode || 'none'),
    numOut(v2.progress,0),
    numOut(v2.computedOverride,0),

    // V3
    numOut(v3.baseDuration,1), numOut(v3.baseFe,0), numOut(v3.baseBe,0), numOut(v3.baseQa,0), numOut(v3.basePm,0),
    numOut(v3.fe,0), numOut(v3.be,0), numOut(v3.qa,0), numOut(v3.pm,0),
    String(v3.obMode || 'none'),
    numOut(v3.progress,0),
    numOut(v3.computedOverride,0),
  ];
}

async function writeAll(sheets, { modules, order }) {
  // meta.order
  const metaRange = `${META_SHEET}!A1:B`;
  const metaRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: metaRange,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const metaRows = metaRes.data.values || [['key','value']];
  let found = false;
  for (let i = 1; i < metaRows.length; i++) {
    if (metaRows[i][0] === 'order') {
      metaRows[i][1] = (order || []).join(',');
      found = true;
      break;
    }
  }
  if (!found) metaRows.push(['order', (order || []).join(',')]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: metaRange,
    valueInputOption: 'RAW',
    requestBody: { values: metaRows }
  });

  // modules sheet’i tamamen yenile
  const header = [HEADER];
  const values = (modules || []).map(moduleRowOut);

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${MODS_SHEET}!A:AZ`
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${MODS_SHEET}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: header.concat(values) }
  });

  return { ok: true };
}

// ------- API handler -------
export default async function handler(req, res) {
  try {
    if (!SHEET_ID) throw new Error('SHEET_ID is missing');
    if (!GOOGLE_SA_EMAIL) throw new Error('GOOGLE_SA_EMAIL is missing');

    const sheets = await sheetsClient();

    if (req.method === 'GET') {
      const [modules, orderStr] = await Promise.all([
        readModules(sheets),
        readMeta(sheets, 'order')
      ]);
      const order = (orderStr || '')
        .split(',')
        .map(n => Number(n))
        .filter(Boolean);
      return res.status(200).json({ modules, order });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const result = await writeAll(sheets, {
        modules: body.modules || [],
        order: body.order || []
      });
      return res.status(200).json(result);
    }

    res.setHeader('Allow', ['GET','POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Sheets API error:', err);
    return res.status(500).json({ error: 'Sheets API error', details: String(err?.message || err) });
  }
}