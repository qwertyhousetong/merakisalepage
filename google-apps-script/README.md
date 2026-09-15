# Order logging setup (Google Sheet + LINE group)

This connects your checkout form to a Google Sheet and posts a notification into a LINE group whenever someone places an order.

Note: LINE Notify (the old, simple way to do this) was shut down by LINE in March 2025. The current replacement is the LINE **Messaging API**, which needs a few more one-time setup steps below — but once it's done, it keeps working the same way.

## 1. Create the Google Sheet + Apps Script

1. Create a new Google Sheet (or open the one you want orders logged into).
2. In the Sheet, go to **Extensions → Apps Script**.
3. Delete the placeholder code and paste in the contents of `Code.gs` from this folder.
4. Leave the CONFIG values at the top blank for now — you'll fill them in below.

## 2. Set up the LINE Messaging API

1. Go to the [LINE Official Account Manager](https://manager.line.biz/) and open your `@meraki` account (or create one if you don't have a proper Official Account yet — the free plan is fine).
2. Go to **Settings → Messaging API** and enable it. This links your OA to a channel in the LINE Developers Console.
3. Under the same settings, turn ON **"Allow bot to join group chats"**.
4. Go to the [LINE Developers Console](https://developers.line.biz/console/), open that channel, click the **Messaging API** tab, and issue a **Channel access token (long-lived)**. Copy it.
5. In `Code.gs`, paste that token into `LINE_CHANNEL_ACCESS_TOKEN`.

## 3. Find your LINE group's ID

LINE doesn't show group IDs anywhere in the app, so you have to capture one:

1. Invite your `@meraki` bot into the LINE group you want order notifications sent to (add it like you'd add any contact to the group).
2. In `Code.gs`, temporarily rename the function `doPost` to `doPost_orders`, and rename `logWebhookForGroupId` to `doPost`.
3. **Deploy → Manage deployments → Edit (pencil icon) → New version → Deploy.**
4. In the LINE Developers Console (Messaging API tab), set the **Webhook URL** to your Apps Script web app URL, and turn "Use webhook" ON.
5. Send any message in the LINE group (with the bot in it).
6. Back in Apps Script, go to **Executions** (left sidebar) and open the latest run. In the logged data, find `"source":{"type":"group","groupId":"C xxxxxxxx..."}` — copy that `groupId` value.
7. Paste it into `LINE_GROUP_ID` in `Code.gs`.
8. Undo step 2 (rename the functions back: `doPost` → `logWebhookForGroupId`, `doPost_orders` → `doPost`), and turn the webhook back off in the Developers Console (Messaging API tab → Use webhook → OFF), since you don't need LINE to call your script anymore.

## 4. (Optional) Save payment slip photos to Drive

1. Create a Google Drive folder for slip photos, and share it so anyone with the link can view.
2. Copy the folder ID from its URL (`drive.google.com/drive/folders/`**`THIS_PART`**).
3. Paste it into `SLIP_DRIVE_FOLDER_ID` in `Code.gs`.

If you skip this, orders still get logged to the Sheet and the LINE group — just without a slip link.

## 5. Deploy the web app

1. **Deploy → New deployment.**
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Click **Deploy**, and authorize the permissions it asks for (this is your own script acting on your own Sheet/Drive/LINE account).
6. Copy the **Web app URL** it gives you (ends in `/exec`).

## 6. Send me the URL

Paste that Web app URL back to me and I'll drop it into `ORDER_LOG_URL` in `index.html` and redeploy the site. From then on, every completed checkout will log a row to your Sheet and post a message in your LINE group automatically.

If you ever need to change the token, group ID, or Drive folder later, just edit `Code.gs` in the Apps Script editor and click **Deploy → Manage deployments → Edit → New version → Deploy** again — the web app URL stays the same, so nothing on the site needs to change.
