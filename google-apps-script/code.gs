/**
 * Sandun & Ishanka – Wedding Invitation backend
 * Connects the website RSVP form and Blessings/Wishes guestbook to Google Sheets.
 *
 * Sheet: https://docs.google.com/spreadsheets/d/1NGttfmNWflZl4H-WgSuXEMuQyrMGZB76YU0CkIA4OBo/edit
 * Tabs used (created automatically if missing): RSVP, WISH
 */

const SPREADSHEET_ID = '1NGttfmNWflZl4H-WgSuXEMuQyrMGZB76YU0CkIA4OBo';

const RSVP_HEADERS = ['Timestamp', 'Name', 'Attendance', 'Guests', 'Phone', 'DietaryNotes'];
const WISH_HEADERS = ['Timestamp', 'Name', 'Message', 'Approved'];

const MAX_WISHES_RETURNED = 200;

/* ------------------------------------------------------------------ */
/*  POST – save an RSVP or a wish                                      */
/* ------------------------------------------------------------------ */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const payload = parsePayload_(e);
    const sheetKey = String(payload.sheet || '').toUpperCase();

    if (sheetKey !== 'RSVP' && sheetKey !== 'WISH') {
      return jsonResponse_({ ok: false, error: 'Invalid sheet. Use RSVP or WISH.' });
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (sheetKey === 'RSVP') {
      const name = clean_(payload.name, 120);
      if (!name) return jsonResponse_({ ok: false, error: 'Name is required.' });

      const sheet = getOrCreateSheet_(ss, 'RSVP', RSVP_HEADERS);
      sheet.appendRow([
        new Date(),
        name,
        clean_(payload.attendance, 40),
        clean_(payload.guests, 10),
        phoneText_(payload.phone), // stored as text so the leading 0 / + is kept
        clean_(payload.dietaryNotes, 500),
      ]);
    } else {
      const name = clean_(payload.name, 80);
      const message = clean_(payload.message, 1000);
      if (!name || !message) return jsonResponse_({ ok: false, error: 'Name and message are required.' });

      const sheet = getOrCreateSheet_(ss, 'WISH', WISH_HEADERS);
      sheet.appendRow([new Date(), name, message, true]);
    }

    return jsonResponse_({ ok: true });
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error && error.message ? error.message : error) });
  } finally {
    try { lock.releaseLock(); } catch (_e) {}
  }
}

/* ------------------------------------------------------------------ */
/*  GET – list wishes for the website guestbook                        */
/*  ?action=wishes                                                     */
/*  (Set a wish's "Approved" cell to FALSE in the sheet to hide it.)   */
/* ------------------------------------------------------------------ */
function doGet(e) {
  const action = e && e.parameter ? String(e.parameter.action || '') : '';

  if (action === 'wishes') {
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = getOrCreateSheet_(ss, 'WISH', WISH_HEADERS);
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) return jsonResponse_({ ok: true, wishes: [] });

      const rows = sheet.getRange(2, 1, lastRow - 1, WISH_HEADERS.length).getValues();
      const wishes = [];
      for (let i = rows.length - 1; i >= 0 && wishes.length < MAX_WISHES_RETURNED; i--) {
        const [ts, name, message, approved] = rows[i];
        if (!name || !message) continue;
        if (approved === false || String(approved).toUpperCase() === 'FALSE') continue;
        wishes.push({
          id: String(i + 2),
          name: String(name),
          message: String(message),
          createdAt: ts instanceof Date ? ts.toISOString() : String(ts),
        });
      }
      return jsonResponse_({ ok: true, wishes: wishes });
    } catch (error) {
      return jsonResponse_({ ok: false, error: String(error && error.message ? error.message : error) });
    }
  }

  return jsonResponse_({ ok: true, message: 'Wedding form endpoint is running.' });
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function parsePayload_(e) {
  const params = e && e.parameter ? e.parameter : {};
  if (Object.keys(params).length > 0) return params;

  const contents = e && e.postData && e.postData.contents ? e.postData.contents : '';
  if (!contents) return {};

  if (contents.indexOf('=') !== -1 && contents.indexOf('{') !== 0) {
    return parseQueryString_(contents);
  }
  try {
    return JSON.parse(contents);
  } catch (_error) {
    return {};
  }
}

function parseQueryString_(query) {
  const out = {};
  const pairs = String(query).split('&');
  for (let i = 0; i < pairs.length; i++) {
    const part = pairs[i];
    if (!part) continue;
    const idx = part.indexOf('=');
    const rawKey = idx >= 0 ? part.slice(0, idx) : part;
    const rawValue = idx >= 0 ? part.slice(idx + 1) : '';
    out[decodeURIComponent(rawKey.replace(/\+/g, ' '))] = decodeURIComponent(rawValue.replace(/\+/g, ' '));
  }
  return out;
}

/** Trims, limits length, and blocks spreadsheet formula injection (=, +, -, @). */
function clean_(value, maxLen) {
  let s = String(value == null ? '' : value).trim().slice(0, maxLen);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

/** Phone as plain text: a single leading ' stops Sheets dropping the 0 or treating + as a formula. */
function phoneText_(value) {
  const s = String(value == null ? '' : value).trim().slice(0, 30);
  return s ? "'" + s : '';
}

function getOrCreateSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
