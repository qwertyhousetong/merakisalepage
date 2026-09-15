# Order logging setup (Google Sheet + Telegram bot)

This connects your checkout form to a Google Sheet and sends a Telegram message — with the payment slip photo attached — to your team chat whenever someone places an order.

Your bot is already created: **@merakisales_bot** (token already filled in for you below).

## 1. Create the Google Sheet + Apps Script

1. Create a new Google Sheet (or open the one you want orders logged into).
2. In the Sheet, go to **Extensions → Apps Script**.
3. Delete the placeholder code and paste in the contents of `Code.gs` from this folder.
4. `TELEGRAM_BOT_TOKEN` is already filled in. Leave `TELEGRAM_CHAT_ID` blank for now — see step 2.

## 2. Get your Telegram chat id

1. Add **@merakisales_bot** to the Telegram group where you want order notifications (or message it directly for a 1-on-1 chat instead of a group).
2. Send any message in that chat (e.g. "hi").
3. Tell me once you've done this — I can fetch the chat id directly using the bot token and drop it straight into the script for you, no extra steps needed on your end.

(If you'd rather do it yourself: visit `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser after sending that message, and look for `"chat":{"id":...}` in the response.)

## 3. (Optional) Save payment slip photos to Drive too

The slip photo already gets sent directly into your Telegram chat with every order. If you *also* want a permanent copy saved in Google Drive (linked in the Sheet):

1. Create a Google Drive folder for slip photos, and share it so anyone with the link can view.
2. Copy the folder ID from its URL (`drive.google.com/drive/folders/`**`THIS_PART`**).
3. Paste it into `SLIP_DRIVE_FOLDER_ID` in `Code.gs`.

If you skip this, orders are still logged to the Sheet and sent to Telegram — the Sheet's "ลิงก์สลิป" column just stays blank.

## 4. Deploy the web app

1. **Deploy → New deployment.**
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Click **Deploy**, and authorize the permissions it asks for (this is your own script acting on your own Sheet/Drive/Telegram bot).
6. Copy the **Web app URL** it gives you (ends in `/exec`).

## 5. Send me the URL

Paste that Web app URL back to me and I'll drop it into `ORDER_LOG_URL` in `index.html` and redeploy the site. From then on, every completed checkout will log a row to your Sheet and post a message (with the slip photo) into your Telegram chat automatically.

If you ever need to change the chat id or Drive folder later, just edit `Code.gs` in the Apps Script editor and click **Deploy → Manage deployments → Edit → New version → Deploy** again — the web app URL stays the same, so nothing on the site needs to change.
