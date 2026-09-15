/**
 * Meraki order logger.
 * Receives an order from the sales page and:
 *   1. Appends a row to a sheet in this spreadsheet
 *   2. Saves the payment slip photo to Google Drive (optional but recommended)
 *   3. Sends a notification — with the slip photo attached — to a Telegram chat/group
 *
 * SETUP: see README.md in this folder for the full step-by-step guide.
 */

// ====== CONFIG — fill these in, then redeploy ======
const SHEET_NAME = 'Orders';
const TELEGRAM_BOT_TOKEN = '8849917262:AAGR8swyjJVTWZjjzGGm4nBDBwSrO69smOk'; // @merakisales_bot
const TELEGRAM_CHAT_ID = '-5369048494';   // "Meraki Sales Noti" group chat
const SLIP_DRIVE_FOLDER_ID = '12-RglJbi7w4MOrpfyFk8LC5rl27bm-76'; // Drive folder id to save slip photos into

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

    notifyTelegram_(data, slipUrl);

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

function notifyTelegram_(data, slipUrl) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const caption = [
    '🛒 ออเดอร์ใหม่ ' + (data.orderId || ''),
    'แพ็กเกจ: ' + (data.packageTitle || ''),
    'สูตร: ' + (data.formulaTitle || ''),
    'ยอดชำระ: ฿' + (data.amount || ''),
    'ผู้รับ: ' + (data.customerName || '') + ' (' + (data.customerPhone || '') + ')',
    'ที่อยู่: ' + (data.customerAddress || '')
  ].join('\n');

  const apiBase = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN;

  // Send the slip photo itself (not just a link) when we have one, with the
  // order details as the caption underneath it.
  if (data.slipImageBase64) {
    const matches = data.slipImageBase64.match(/^data:(image\/\w+);base64,(.*)$/);
    if (matches) {
      const bytes = Utilities.base64Decode(matches[2]);
      const blob = Utilities.newBlob(bytes, matches[1], 'slip-' + (data.orderId || 'order') + '.jpg');
      const resp = UrlFetchApp.fetch(apiBase + '/sendPhoto', {
        method: 'post',
        payload: {
          chat_id: TELEGRAM_CHAT_ID,
          caption: caption,
          photo: blob
        },
        muteHttpExceptions: true
      });
      // If sendPhoto succeeded we're done; otherwise fall through to a text message
      // so an order is never silently lost just because the photo failed to send.
      const ok = JSON.parse(resp.getContentText()).ok;
      if (ok) return;
    }
  }

  UrlFetchApp.fetch(apiBase + '/sendMessage', {
    method: 'post',
    payload: { chat_id: TELEGRAM_CHAT_ID, text: caption },
    muteHttpExceptions: true
  });
}
