// Paste this into Extensions > Apps Script in the Google Sheet that should receive the answers.

const SHEET_NAME = 'Form responses 1';  // the tab to add rows to
const SECRET = 'change-me';             // must match "key" in config.js

const FIRST_SLOT_MIN = 7 * 60 + 30;     // 07:30
const LAST_SLOT_MIN = 21 * 60;          // 21:00
const STEP_MIN = 30;

function pad_(n) { return ('0' + n).slice(-2); }

// Timestamp, Date, then "A 07:30", "B 08:00" ... "Z 20:00", "ZA 20:30", "ZB 21:00"
function buildHeaders_() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const headers = ['Timestamp', 'Date'];
  let i = 0;
  for (let m = FIRST_SLOT_MIN; m <= LAST_SLOT_MIN; m += STEP_MIN, i++) {
    const code = i < 26 ? letters[i] : 'Z' + letters[i - 26];
    headers.push(code + ' ' + pad_(Math.floor(m / 60)) + ':' + pad_(m % 60));
  }
  return headers;
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    const headers = buildHeaders_();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

// Run this once from the editor to authorise the script and create the header row.
function setup() {
  ensureHeaders_(getSheet_());
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Opening the web app URL in a browser shows this, so you can check the deployment works.
function doGet() {
  return ContentService.createTextOutput('S&P predictions endpoint is running.');
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let locked = false;
  try {
    lock.waitLock(20000);
    locked = true;

    const data = JSON.parse(e.postData.contents);
    if (data.key !== SECRET) return out_({ ok: false, error: 'bad key' });

    const slotCount = buildHeaders_().length - 2;
    if (!Array.isArray(data.answers) || data.answers.length !== slotCount) {
      return out_({ ok: false, error: 'expected ' + slotCount + ' answers' });
    }
    for (let i = 0; i < data.answers.length; i++) {
      if (data.answers[i] !== 'Up' && data.answers[i] !== 'Down') {
        return out_({ ok: false, error: 'answer ' + (i + 1) + ' must be Up or Down' });
      }
    }
    const dateParts = String(data.date).split('-').map(Number);
    if (dateParts.length !== 3 || dateParts.some(isNaN)) return out_({ ok: false, error: 'bad date' });

    // A retry of an upload that already worked is acknowledged but not added twice.
    const props = PropertiesService.getScriptProperties();
    const seen = JSON.parse(props.getProperty('seen') || '[]');
    if (data.id && seen.indexOf(data.id) !== -1) return out_({ ok: true, duplicate: true });

    const sheet = getSheet_();
    ensureHeaders_(sheet);

    let stamp = new Date(data.submittedAt);
    if (isNaN(stamp.getTime())) stamp = new Date();
    const day = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

    sheet.appendRow([stamp, day].concat(data.answers));
    const row = sheet.getLastRow();
    sheet.getRange(row, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    sheet.getRange(row, 2).setNumberFormat('dd/MM/yyyy');

    if (data.id) {
      seen.push(data.id);
      props.setProperty('seen', JSON.stringify(seen.slice(-300)));
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    if (locked) lock.releaseLock();
  }
}
