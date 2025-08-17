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
  // 1) Dosyadan oku (tercih edilen, senin kurduğun yöntem)
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
    // Çoğu zaman .env’de \n escape’li gelir; gerçek newline’a çevir:
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

  // Sürüm farkı sorunlarına girmemek için token alarak doğrula
  await jwt.getAccessToken();

  return google.sheets({ version: 'v4', auth: jwt });
}

// ------- Basit okuma/yazma yardımcıları (değişmedi) -------
async function readModules(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${MODS_SHEET}!A1:N`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const rows = res.data.values || [];
  if (rows.length <= 1) return [];
  const data = rows.slice(1).filter(r => r[0] !== undefined && r[0] !== '');
  return data.map(r => ({
    id: Number(r[0]),
    name: r[1],
    desc: r[2],
    color: r[3],
    baseDuration: Number(r[4] || 0),
    baseFe: Number(r[5] || 0),
    baseBe: Number(r[6] || 0),
    baseQa: Number(r[7] || 0),
    fe: Number(r[8] || 0),
    be: Number(r[9] || 0),
    qa: Number(r[10] || 0),
    deps: r[11] ? JSON.parse(r[11]) : [],
    enabled: r[12] === true || r[12] === 'true' || r[12] === 1,
    isMvp:  r[13] === true || r[13] === 'true' || r[13] === 1,
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
  const header = [[
    'id','name','desc','color','baseDuration','baseFe','baseBe','baseQa',
    'fe','be','qa','deps_json','enabled','isMvp'
  ]];
  const values = (modules || []).map(m => ([
    m.id, m.name, m.desc || '', m.color || '#999999',
    Number(m.baseDuration || 0), Number(m.baseFe || 0), Number(m.baseBe || 0), Number(m.baseQa || 0),
    Number(m.fe || 0), Number(m.be || 0), Number(m.qa || 0),
    JSON.stringify(m.deps || []),
    !!m.enabled, !!m.isMvp
  ]));

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${MODS_SHEET}!A:Z`
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