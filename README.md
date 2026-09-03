# Pixel Villa Dashboard

Staff-only web dashboard for the Pixel Villa Discord bot. Reads and writes
the same Firebase Firestore project the bot uses — no data duplication,
changes show up on both sides.

Pages: Overview · Warnings · Staff activity · ModMail tickets · Bot health.
No mute/kick/ban actions live here on purpose — moderation stays in Discord.

## 1. Create the repo

```bash
mkdir pixel-villa-dashboard
cd pixel-villa-dashboard
# copy all these files in, then:
git init
git add .
git commit -m "Initial dashboard scaffold"
git remote add origin <your-new-github-repo-url>
git push -u origin main
npm install
```

## 2. Discord OAuth app

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   → your bot's application (or a new one) → **OAuth2**.
2. Add a redirect URL: `http://localhost:3000/api/auth/callback/discord`
   (add the Render URL too once deployed, e.g.
   `https://pixel-villa-dashboard.onrender.com/api/auth/callback/discord`).
3. Copy the **Client ID** and **Client Secret** into `.env.local`.

## 3. Reuse your bot's credentials

Same `.env` values your bot already has:
- `DISCORD_BOT_TOKEN` — same bot token
- `DISCORD_GUILD_ID` — `1510176142286389329`
- `STAFF_ROLE_IDS` — the role IDs for Moderator / Senior Mod / Head Mod / Admin
- `FIREBASE_KEY` — same Firebase Admin credentials the bot uses

**About `FIREBASE_KEY`**: `lib/firebaseAdmin.js` expects this to contain the
full service-account JSON (either as one plain-text JSON string, or
base64-encoded — it tries both automatically). Open your bot's `.env` and
check exactly what's stored there — if it's actually just a project ID
string rather than the full service account, you'll instead need to
generate a service account key from
Firebase Console → Project Settings → Service Accounts → Generate new
private key, and use that JSON instead.

## 4. Environment variables

Copy `.env.example` to `.env.local` and fill it in:

```bash
cp .env.example .env.local
```

Generate `NEXTAUTH_SECRET` with:
```bash
openssl rand -base64 32
```

## 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/login`. Only
Discord accounts that hold one of `STAFF_ROLE_IDS` in the guild can sign in
(checked server-side in `app/api/auth/[...nextauth]/route.js` via
`lib/discord.js`).

## 6. Deploy to Render

1. New **Web Service** on Render, connect this repo.
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Add all the env vars from `.env.local` in Render's dashboard, plus:
   - `NEXTAUTH_URL` = your Render URL (e.g. `https://pixel-villa-dashboard.onrender.com`)
   - `BOT_STATUS_URL` = your bot's existing Render URL, so the Bot health
     page can ping its keep-alive server
5. Update the Discord OAuth redirect URL to match the Render URL.

## Important: adjust field names to your actual Firestore schema

The API routes (`app/api/warnings`, `app/api/staff-activity`,
`app/api/modmail`) assume collection/field names like `warnings`,
`activetime`, `modmailTickets`, `reason`, `moderatorTag`, `activeSeconds`,
etc. These are guesses based on what's been discussed about the bot —
open your bot's Firestore and match these to your real collection and
field names before this will show real data.

## Next steps once this works

- Wire ModMail replies to actually send back through the bot (needs a small
  endpoint on the bot side, or a shared Firestore "outgoing" queue it polls)
- Add pagination to Warnings once the collection gets large
- Expand Bot health with real uptime/error-log data from the bot itself
