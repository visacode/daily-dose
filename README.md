# Daily Dose

Personal daily-discovery dashboard. Three bots fill it each morning:

- **Daily Memes** — memes and funny posts (`memes`)
- **Trend Spotter** — trending places and things, with a Riyadh bias (`places`, `things`)
- **Hidden Gems** — quieter places in Riyadh and useful apps (`gemPlaces`, `gemApps`)

Video, posts, and maps play on the page. **Open original** is the link that leaves the site.

The interface is an Ionic app. Today, Watch, Explore, and Saved are tabs. Routes use the URL hash (`/#/tabs/today`) so they keep working on GitHub Pages under `/daily-dose/`.

Live site: <https://visacode.github.io/daily-dose/>

## Update a day

Bots ship a day by committing JSON only. Write these three files together so they describe the same edition:

| File | Role |
| --- | --- |
| `public/data/YYYY-MM-DD.json` | That day's archive. The name matches the `date` field. |
| `public/data/today.json` | Identical copy of the latest archive. The homepage loads this. |
| `public/data/index.json` | Lists every archive and which one is latest. |

`npm run validate` checks that the trio agrees. The Pages workflow runs it before deploy.

### `public/data/YYYY-MM-DD.json` and `public/data/today.json`

```json
{
  "date": "2026-11-10",
  "updated": "Tue 10 Nov 2026",
  "items": [
    {
      "cat": "memes",
      "title": "GTA 6 is 30 FPS, even on the Pro",
      "note": "Short line for the card.",
      "source": "X",
      "href": "https://x.com/Wario64/status/2120154417303605390",
      "tag": "Gaming",
      "read": "Longer summary shown in the reader. Falls back to note when omitted.",
      "facts": [
        ["Posted", "10 Nov 2026, 4:59 PM Asia/Riyadh"],
        ["Views", "about 1.24 million"]
      ],
      "embed": "x"
    }
  ]
}
```

`public/data/schema.json` is the same contract in JSON Schema.

| Field | Required | Meaning |
| --- | --- | --- |
| `date` | yes | `YYYY-MM-DD` |
| `updated` | yes | Label in the hero, e.g. `Tue 10 Nov 2026` |
| `items` | yes | Non-empty array. `href` values must be unique inside the file. |
| `cat` | yes | `memes`, `places`, `things`, `gemPlaces`, or `gemApps` |
| `title` | yes | Card and reader heading |
| `note` | yes | Short card blurb |
| `source` | yes | Outlet name, e.g. `YouTube`, `X`, `Google Maps` |
| `href` | yes | `http` or `https` URL. **Open original** goes here. |
| `tag` | yes | Short chip, e.g. `Riyadh`, `Gaming` |
| `read` | no | Reader body. Omit it and the reader shows `note`. |
| `facts` | no | Array of `[label, value]` string pairs |
| `image` | no | Photo or preview URL. Shown on the card and in the reader. |
| `video` | no | Direct file URL (`mp4`, `webm`). Played in a video element. |
| `embed` | no | `youtube`, `x`, `tiktok`, `instagram`, `image`, `map`, or `none` |
| `mapQuery` | no | Google Maps search text. No API key. |
| `favicon` | no | Site icon URL. |
| `videoStyle` | no | `short` or `wide`. Shorts, TikTok, and clips under 75 seconds are vertical when this is omitted. |
| `article` | no | `{ html, paragraphs, byline, published, siteName }`. Full page in the reader. |
| `place` | no | `{ hours, price, area, phone, photos, rating }`. Hours, phone, address, and price facts fill the gaps. |
| `app` | no | `{ icon, screenshots, rating, price, platforms, appStore, playStore }`. Platform and price facts fill the gaps. |

Every new field is optional. A day file that only has the original fields still validates and still renders.

### Articles, places, and apps

`scripts/enrich-articles.mjs` fetches each `href` that is not YouTube, X, TikTok, Instagram, or a Maps link. It stores readable HTML (scripts and styles removed), plain paragraphs, byline, published time, site name, `og:image`, and favicon. On app pages it also keeps the first App Store and Google Play links it finds. If a field already has a value, the script does not replace it. If a site blocks the fetch, the item keeps its summary.

The **Enrich articles** workflow runs that script on pushes to `public/data/**`, every day at 06:00 UTC (09:00 in Riyadh), and on demand. **Deploy to GitHub Pages** runs the same script before the build, so the live site gets the text on the data push itself.

In the reader, a place shows its map, photo gallery, hours, price, area, a tap-to-call phone link, and Directions (Google Maps and Apple Maps). An app shows its icon, screenshot carousel, rating, price, platforms, and store buttons when those URLs exist.

### Watch, saved, and archive

**Watch** is a full-screen vertical feed of the day's YouTube, X, TikTok, Instagram, and direct-video items. YouTube autoplays and advances when the clip ends. Other embeds advance after a short dwell. Mute toggles YouTube and file video. Swipe up or down, or use the arrow keys.

**Saved** is a tab stored in `localStorage` on this device. Seen items dim, unseen ones get a New badge after the first one is opened, and the hero shows "x of y seen" plus a daily streak in Asia/Riyadh. **Share** uses the Web Share API, or copies the link.

**This day / All days** next to search loads other `public/data/YYYY-MM-DD.json` files only after you ask, then searches them with the current tab.

### Install

`manifest.webmanifest` and the generated `sw.js` use scope `/daily-dose/`. The service worker caches the built shell and, after you open them, the day JSON files, so a recent edition can be reread offline. Add it to the home screen from the browser share sheet.

### How media is chosen

When `embed` is omitted, the site infers it:

| Signal | Player |
| --- | --- |
| YouTube or youtu.be URL | YouTube embed. Cards use `https://i.ytimg.com/vi/<id>/hqdefault.jpg`. |
| `x.com` or `twitter.com` status URL | Official embed from `https://platform.twitter.com/widgets.js` |
| TikTok `/video/<id>` | `https://www.tiktok.com/embed/v2/<id>` |
| Instagram `/p/`, `/reel/`, or `/tv/` | Instagram embed |
| Google Maps URL, or `cat` is `places` or `gemPlaces` | Maps embed for `mapQuery`, then an address/location/venue/where fact, then the title |
| `image` set and nothing above matches | Image preview |
| anything else | Summary only |

`embed: "none"` turns the player off, including the map on a place. `image` still shows when it is set, including next to a map. A direct `video` file plays under the other players.

### `public/data/index.json`

```json
{
  "latest": "2026-11-10",
  "days": [
    { "date": "2026-11-10", "updated": "Tue 10 Nov 2026", "count": 30 }
  ]
}
```

`latest` must be one of `days`. `count` must equal that file's `items` length. `updated` must match the edition. Newest-first or oldest-first both work; the date picker sorts newest first.

A past day is available at `https://visacode.github.io/daily-dose/?day=YYYY-MM-DD` once its file and index entry exist.

### Optional preview images

`node scripts/enrich-previews.mjs [YYYY-MM-DD]` reads `og:image` / `twitter:image` for items that have no `image`. It skips YouTube and X. It rewrites that day's file and, when that day is `latest`, `today.json` too.

The **Enrich link previews** workflow runs the same script on demand (Actions → Enrich link previews → Run workflow). A commit from that workflow does not start the Pages workflow by itself. Run **Deploy to GitHub Pages** afterward, or push any other commit to `main`.

## Local development

```bash
npm ci
npm run validate
npm run dev
```

Open <http://127.0.0.1:5173/daily-dose/>. The dev server uses the same `/daily-dose/` base path as the live site.

```bash
npm run build
npm run preview
```

Preview is <http://127.0.0.1:4173/daily-dose/>.

## Deploy

Hosting is GitHub Pages. `.github/workflows/pages.yml` validates the JSON, builds the Vite app, and deploys `dist` on every push to `main` and when someone runs the workflow by hand.

The site base path is `/daily-dose/` (`vite.config.ts`). Asset URLs and `public/data/*.json` are fetched from that path.

### What to click if Pages is not live yet

The workflow cannot turn Pages on. After this branch is on `main`:

1. Open <https://github.com/visacode/daily-dose/settings/pages>.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. This repository is currently **private**. GitHub Pages for a private repository needs GitHub Pro, GitHub Team, GitHub Enterprise Cloud, or GitHub Enterprise Server. On GitHub Free, make the repository public first: **Settings → General → Danger Zone → Change repository visibility → Public**.
4. Open the **Actions** tab and confirm **Deploy to GitHub Pages** finished on `main`.
5. If the deploy job waits on the `github-pages` environment, approve it under **Settings → Environments → github-pages**, or remove a required-reviewer rule you added there.

The site is then <https://visacode.github.io/daily-dose/>.

If the deploy fails with a message that Pages has not been enabled, steps 1–3 are still outstanding.
