# SK1.0 — Official Website (GitHub Pages)

Yeh ek **static website** hai (sirf HTML, CSS, JavaScript). Koi paid service, framework ya build step nahi chahiye.
Isme **koi token / secret nahi hai** — aur kabhi daalna bhi nahi.

## Folder mein kya hai
| File | Kaam |
|---|---|
| `index.html` | Home: hero, stats, features, how it works, invite, about, support/FAQ |
| `commands.html` | Saari commands (search, category filter, copy button) |
| `status.html` | Bot status / uptime (sirf asli report se) |
| `privacy.html`, `terms.html` | Privacy Policy aur Terms (template) |
| `404.html` | Galat link ka page |
| `style.css`, `script.js` | Design aur sab kaam |
| **`site-config.js`** | **Yahi ek file edit karni hai** (invite, support link, email...) |
| `data/commands.js/json` | Bot ke code se auto-bani command list (284 public commands) |
| `data/stats.json` | Live stats ki file (shuru mein "not connected" placeholder) |
| `tools/gen_site_data.py` | Bot ke code se command list dobara banata hai |
| `tools/publish_stats.py` | Bot ke saath chalkar asli stats file banata hai |
| `optional/github-pages-workflow.yml` | Optional GitHub Actions deploy (zaroori nahi) |

---
## STEP 1 — `site-config.js` bharo (Android par)
1. Phone ke file manager mein zip extract karo, `site-config.js` ko kisi text editor (jaise Acode / QuickEdit) mein kholo.
2. Ye cheezen bharo (jo nahi pata, khaali `""` chhod do — website "not set yet" dikhayegi, jhoot nahi):
   - `clientId` — Discord Developer Portal → aapki app → **General Information → Application ID**. (Pehle se `1523177627534229614` daala hai; Portal mein match kar lena.)
   - `supportServerUrl` — jaise `"https://discord.gg/abcdEFG"`
   - `contactEmail`, `controllerName`, `lastUpdated` (privacy/terms ke liye)
   - `social` links (optional)
   - `premium` — sirf tab jab sach mein plans/donation hon. Warna `null` rehne do.
3. **Client Secret ya Token yahan KABHI mat likhna.**

## STEP 2 — Phone par website pehle dekh lo (Termux)
```
cd /storage/emulated/0/Download/sk_website
python3 -m http.server 8080
```
Phir phone ke browser mein kholo: `http://127.0.0.1:8080`
Band karne ke liye Termux mein `Ctrl + C`.
(Agar "No such file" aaye to `ls /storage/emulated/0/Download` se folder ka sahi naam dekho. Pehle `termux-setup-storage` ek baar chalana padta hai.)

## STEP 3 — GitHub par daalo (sabse aasan: sirf browser)
1. https://github.com par account banao / login karo.
2. Upar **+ → New repository**. Name: `sk-website` (kuch bhi). **Public** chuno. **Create repository**.
3. **uploading an existing file** link dabao.
4. Zip se nikli saari files **aur folders** (`assets`, `data`, `tools`, `optional`, `index.html`, `style.css`, ...) select karke upload karo.
   Tip: Android file picker folder nahi uthata — agar folder na dikhe to uske andar ki files ek-ek folder ke andar se upload karo (GitHub folder ka naam path mein likhne deta hai, jaise `data/commands.js`), ya phone ke browser ko **Desktop site** mode mein karo.
   `.nojekyll` file bhi honi chahiye (hidden file hai; na ho to **Add file → Create new file** mein naam `.nojekyll` likh kar khaali save kar do).
5. **Commit changes** dabao.

## STEP 4 — GitHub Pages ON karo
1. Repo mein **Settings → Pages**.
2. **Build and deployment → Source: Deploy from a branch**.
3. Branch: **main**, folder: **/ (root)** → **Save**.
4. 1–2 minute baad wahi page par link dikhega: `https://<aapka-username>.github.io/sk-website/`
5. Sab links relative hain, isliye project URL par bhi sahi chalenge.

(Optional: agar **GitHub Actions** se deploy chahiye to `optional/github-pages-workflow.yml` ko `.github/workflows/pages.yml` naam se repo mein rakho aur Pages → Source: **GitHub Actions** chuno. Dono tareeke ek saath mat use karo.)

## STEP 5 — Command list update karna (jab bot mein naya command aaye)
```
cd ~/sk_website            # ya jahan website folder hai
python3 tools/gen_site_data.py ~/sk_ult/sk_bot
```
(`~/sk_ult/sk_bot` = aapke bot ka folder.) Yeh `data/commands.js` aur `data/commands.json` naye bana dega, phir unhe GitHub par dobara upload kar do. Script bot ki files sirf **padhti** hai, badalti nahi. Owner-only commands website par naam se nahi dikhte.

---
## LIVE STATS KAISE JODEIN (safe tareeka)
**Sach yeh hai:** GitHub Pages bot ko chala nahi sakta aur bot ka haal bhi nahi jaan sakta. Isliye jab tak koi report nahi aati, website **"Not connected / Unavailable"** dikhati hai (nakli number kabhi nahi). Commands ka count hamesha asli hai (bot ke code se).

### Tareeka A — Phone/Termux se (free, aasan)
`tools/publish_stats.py` bot ke saath usi phone par chalta hai aur `data/stats.json` banata hai: servers (Discord API se), tracked users (DB se sirf ginti), online/uptime (main.py chal raha hai ya nahi).
1. Ek baar test:
   ```
   cd ~/sk_website
   python3 tools/publish_stats.py
   ```
   (Token `.bashrc` ke `SK_BOT_TOKEN` se uthata hai; kahin likhta ya print nahi karta. DB path `SK_BOT_DB_PATH` se.)
2. GitHub par apne aap bhejne ke liye website folder ko git repo banao:
   ```
   pkg install git
   cd ~/sk_website
   git init -b main
   git remote add origin https://github.com/<username>/sk-website.git
   git add .
   git commit -m "site"
   git push -u origin main
   ```
   Jab Termux username/password maange: password ki jagah **GitHub Personal Access Token** (sirf isi repo ka, "Contents: read & write") **sirf Termux mein type karo** — chat mein kabhi mat bhejna.
3. Har 15 minute par update:
   ```
   python3 tools/publish_stats.py --push --every 15
   ```
   Alag Termux session / `tmux` mein chalao.
**Limits (imaandari se):** phone off/net band ho to report ruk jaati hai — tab website 30 minute baad "No recent report" dikhati hai (yeh "offline" nahi hai). Har update ek git commit banata hai, isliye 10 minute se kam mat rakho. Report mein koi user naam/ID nahi hoti, sirf ginti.

### Tareeka B — Bada / 24x7 setup
Bot ke server par ek chhota API (jaise Cloudflare Worker ya VPS) rakho jo wahi JSON deta ho: `{"updated":"2026-10-29T10:00:00Z","online":true,"uptime_seconds":12345,"servers":17,"tracked_users":41}` aur `site-config.js` mein `statsUrl` usi `https://...` URL par kar do (us API par CORS allow karna hoga). Token us server par hi rahe, website mein kabhi nahi.

---
## Aam dikkatein
- **Add to Discord dabane par "not set yet"?** `clientId` galat/khaali hai.
- **Support button par "not set yet"?** `supportServerUrl` bharo.
- **Stats "Unavailable"?** Normal hai jab tak publish_stats.py nahi chalta.
- **Page nahi khul raha (404)?** Pages ON hua ya nahi (Step 4) aur `index.html` repo ke root mein hai ya nahi dekho.
- **Naya kuch badla par purana dikh raha?** Browser mein refresh (reload) karo.

*Yeh site Discord Inc. se judi hui ya unki endorsed nahi hai.*
