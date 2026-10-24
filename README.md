# ICC MP Davos Circle 2027 · Register interest

Static site (no build step). Target URL: https://icc-mp-register-interest-davos.vercel.app/

## The form

The form sends five answers plus a timestamp to the Google Sheet through SheetDB:

```
Submitted At | Full Name | Mobile (WhatsApp) | Email | Schengen Visa | Notes
```

SheetDB only fills columns that already exist in row 1 of the sheet, and these headers are already there. The sheet also has older columns from the first version (Company, Designation, City, ICC MP Member ID, No. of Delegates, Accommodation Help, Valid Passport). New rows leave those blank, so you can delete those columns or keep them.

To send rows to a separate tab, set `SHEET_TAB` in `app.js` to that tab's name.

**Lock down the API.** The SheetDB URL is visible in the page source. In the SheetDB dashboard, turn off **read, update and delete** for this API and leave only **create** on.

## Deploy on Vercel

- **Vercel CLI:** in this folder run `npx vercel --prod`, and name the project exactly `icc-mp-register-interest-davos`. Run the same command again for later updates.
- **Vercel Drop:** drag this folder (or a zip with `index.html` at the top level) onto vercel.com/drop. Each drop creates a new project, so delete the old one first to keep the same URL.

## Settings (top of `app.js`)

| Setting | Purpose |
|---|---|
| `SHEETDB_URL` | `https://sheetdb.io/api/v1/5jbygah71womk` |
| `SHEET_TAB` | Empty means the first tab |
| `DEADLINE` | 5 Nov 2026, 23:59 IST. After this the form is replaced by a "closed" notice |

To preview the closed state, add `?state=closed` to the URL.

## Design source

Everything comes from `ICC_MP_Global_Circle_Invitation.pdf` (three pages, Shabd Creatives).

- **Page 1, cover:**
  - Logo `assets/logo-davos-circle.svg` and seat icon `assets/icon-seat.svg` are vector artwork rebuilt from the PDF.
  - Background `assets/cover-bg.jpg` is the PDF's own background, rendered with the text removed.
- **Page 2, exclusive inclusions:**
  - The winding line, circles and icons in `assets/inclusions-line.svg` are vector artwork from the PDF.
  - Background `assets/inclusions-bg.jpg` comes from the PDF.
  - Text is live HTML, placed on the same coordinates as the print.
- **Page 3, investment:**
  - Backgrounds `assets/invest-bg-top.jpg` and `invest-bg-bottom.jpg` come from the PDF.
  - The price pills are CSS gradients matched to the print.
  - The ICC Unite logo is `assets/icc-unite.jpg`. It is only 151 px wide in the PDF, so a higher-resolution file would sharpen it.
  - The registration form sits between the notes and the ICC logo.
- **Layout:** on phones and tablets the three pages stack. On desktop (1024px and wider), the cover stays pinned on the left while pages 2 and 3 scroll on the right.
- **Sizing:** sizes in `styles.css` are written in the PDF's points, multiplied by a unit (`--u`, `--c`, `--v`), so proportions match the print at any width.
- **Type:** Figtree (SIL Open Font License), self-hosted, stands in for Cera Pro. Tracking on the cover lines is fitted so each line matches its printed width.
- **WhatsApp link preview:** `assets/og-davos-2027.jpg`.
