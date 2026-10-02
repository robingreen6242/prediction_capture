# S&P Market Predictions: setup

Two parts: the Google Sheet side (about 5 minutes) and putting the app online (about 5 minutes).
Try it on a **test sheet first**. Once it feels right, point it at your real sheet.

## Part 1: Connect the Google Sheet

1. Open the Google Sheet that should receive the answers.
2. **Extensions > Apps Script**. Delete anything in the editor and paste in the contents of `Code.gs`.
3. At the top of the script, change `SECRET` to a private phrase of your own. Check `SHEET_NAME` is the tab you want rows added to (a new tab with that name is created if it doesn't exist).
4. Set the time zone: **Project Settings** (cog icon), tick **Show "appsscript.json" manifest file in editor**, open `appsscript.json` and make sure `"timeZone"` is `"Europe/London"`. (The `appsscript.json` in this folder has the right settings if you want to paste it in.)
5. Choose the function `setup` in the toolbar and click **Run**. Approve the permissions when Google asks. This writes the header row if the tab is empty.
6. **Deploy > New deployment > Web app**. Set *Execute as*: **Me**, *Who has access*: **Anyone**. Click Deploy and copy the **Web app URL** (ends in `/exec`).
7. Open that URL in a browser. You should see "S&P predictions endpoint is running."

If you change `Code.gs` later, redeploy with **Deploy > Manage deployments > edit (pencil) > Version: New version > Deploy**. The URL stays the same.

## Part 2: Put the app online

1. Open `config.js` and paste the Web app URL into `endpoint`. Set `key` to the same phrase you used for `SECRET`.
2. Upload this whole folder to a free static host. The easiest options:
   - **Netlify**: go to app.netlify.com/drop and drag the folder onto the page.
   - **Cloudflare Pages** or **GitHub Pages** also work.
3. Open the site address on your phone.
   - **iPhone (Safari)**: Share > Add to Home Screen.
   - **Android (Chrome)**: menu > Install app / Add to Home screen.

The app then opens full-screen like a normal app and works offline. Finished entries wait on the phone and upload by themselves once there is a connection.

## How it behaves

- Pick the date (defaults to today), then Start predictions.
- 28 questions, 07:30 to 21:00, each answered **Up** or **Down**. **Next** is greyed out until you choose. **Back** lets you change an earlier answer. The last question's button reads **Submit**.
- If you close the app part-way through, it offers to resume where you left off.
- Each submission adds one row: Timestamp, Date, then the 28 answers under the headers `A 07:30` ... `ZB 21:00`.

## Notes

- If your current sheet is the one linked to a Google Form, rows added by the script work, but Google can be fussy about it. A separate or unlinked tab is the safest.
- The `key` in `config.js` is visible to anyone who views the page source. It only stops casual junk posts. It isn't real security, so don't use the endpoint for anything sensitive.
- After you edit `config.js` or `index.html` and re-upload, the phone picks up the change on the second open (the offline cache refreshes in the background).
