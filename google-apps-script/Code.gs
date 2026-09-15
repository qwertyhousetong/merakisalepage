/**
 * Meraki order logger.
 * Receives an order from the sales page and:
 *   1. Appends a row to a sheet in this spreadsheet
 *   2. Optionally saves the payment slip photo to Google Drive
 *   3. Pushes a notification to a LINE group via the Messaging API
 *
 * SETUP: see README.md in this folder for the full step-by-step guide.
 */

// ====== CONFIG — fill these in, then redeploy ======
const SHEET_NAME = 'Orders';
const LINE_CHANNEL_ACCESS_TOKEN = ''; // long-lived channel access token from LINE Developers Console
const LINE_GROUP_ID = '';             // the target LINE group's id (see README for how to find it)
const SLIP_DRIVE_FOLDER_ID = '';      // optional: Drive folder id to save slip photos into

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getSheet_();

    let slipUrl = '';
    if (data.slipImageBase64 && SLIP_DRIVE_FOLDER_ID) {
      slipUrl = saveSlipToDrive_(data.slipImageBase64, data.orderId);
    }

    sheet.appendRow([
      new Date(),
      data.orderId || '',
      data.packageTitle || '',
      data.formulaTitle || '',
      data.amount || '',
      data.customerName || '',
      data.customerPhone || '',
      data.customerAddress || '',
      slipUrl
    ]);

    notifyLineGroup_(data, slipUrl);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Visiting the web app URL directly (GET) just confirms it's alive.
function doGet(e) {
  return ContentService.createTextOutput('Meraki order logger is running.');
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['เวลา', 'เลขที่ออเดอร์', 'แพ็กเกจ', 'สูตร', 'ยอดชำระ', 'ชื่อผู้รับ', 'เบอร์โทร', 'ที่อยู่', 'ลิงก์สลิป']);
  }
  return sheet;
}

function saveSlipToDrive_(base64Data, orderId) {
  try {
    const matches = base64Data.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!matches) return '';
    const contentType = matches[1];
    const bytes = Utilities.base64Decode(matches[2]);
    const blob = Utilities.newBlob(bytes, contentType, 'slip-' + orderId + '.jpg');
    const folder = DriveApp.getFolderById(SLIP_DRIVE_FOLDER_ID);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    return '';
  }
}

function notifyLineGroup_(data, slipUrl) {
  if (!LINE_CHANNEL_ACCESS_TOKEN || !LINE_GROUP_ID) return;

  const lines = [
    '🛒 ออเดอร์ใหม่ ' + (data.orderId || ''),
    'แพ็กเกจ: ' + (data.packageTitle || ''),
    'สูตร: ' + (data.formulaTitle || ''),
    'ยอดชำระ: ฿' + (data.amount || ''),
    'ผู้รับ: ' + (data.customerName || '') + ' (' + (data.customerPhone || '') + ')',
    'ที่อยู่: ' + (data.customerAddress || '')
  ];
  if (slipUrl) lines.push('สลิป: ' + slipUrl);

  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN },
    payload: JSON.stringify({
      to: LINE_GROUP_ID,
      messages: [{ type: 'text', text: lines.join('\n') }]
    }),
    muteHttpExceptions: true
  });
}

/**
 * ONE-TIME HELPER — run this by setting it as your Messaging API webhook
 * temporarily to discover your LINE group's id. See README step 3.
 * It just logs whatever LINE sends so you can read the groupId out of it.
 */
function logWebhookForGroupId(e) {
  Logger.log(e.postData.contents);
  return ContentService.createTextOutput('OK');
}
