# 🚀 Self-Hosting & Deployment Guide

This document provides setup instructions for running CommitPulse locally, configuring database tracking, and deploying to production.

---

## 🚀 Self-Hosting in 4 Steps

```bash
# 1. Clone the repository
git clone https://github.com/JhaSourav07/commitpulse.git && cd commitpulse

# 2. Install dependencies
npm install

# 3. Create your environment file
cat > .env.local << 'EOF'
GITHUB_TOKEN=your_github_pat_here

# GITHUB_PAT is also accepted as an alias for GITHUB_TOKEN
# Optional — enables user tracking (see below)
# MONGODB_URI=mongodb+srv://...
EOF

# 4. Start the development server
npm run dev
```

> **📌 Token Scope:** Your GitHub Personal Access Token needs the `read:user` scope only. No write permissions required.

Then visit: `http://localhost:3000/api/streak?user=YOUR_USERNAME`

> [!TIP]
> If port 3000 is already in use by another application, you can start the development server on a custom port using:
>
> ```bash
> npm run dev -- -p 3001
> ```

---

## 🗄️ Optional: MongoDB User Tracking

CommitPulse records the GitHub username of everyone who generates a monolith from the landing page into a MongoDB collection. This is **entirely optional for local development** — the app works perfectly without it.

If `MONGODB_URI` is not set, the `/api/track-user` endpoint will log a warning and skip the database write gracefully:

```
WARN: MONGODB_URI is not set. Bypassing user tracking for local development.
```

To enable tracking locally, add your connection string to `.env.local`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/commitpulse
```

For production (Vercel), add `MONGODB_URI` to your project's **Environment Variables** settings.

---

## 🔔 Optional: GitHub Push Webhook (Instant Badge Refresh)

Badge/SVG contribution data is cached and refreshes automatically once the cache TTL expires. If you want a badge to update immediately after a push instead of waiting out the TTL, configure a GitHub webhook that invalidates the cache on each push:

1. Add a shared secret to your environment:

   ```env
   GITHUB_WEBHOOK_SECRET=a_long_random_secret
   ```

2. In your GitHub repository settings, go to **Settings → Webhooks → Add webhook** and set:
   - **Payload URL**: `https://<your-deployment>/api/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: the same value as `GITHUB_WEBHOOK_SECRET`
   - **Which events**: just the `push` event

   > **⚠️ Note the URL:** the correct endpoint is `/api/webhooks/github` (plural `webhooks`). This is the only webhook endpoint in CommitPulse — it validates the signature and invalidates the cached contribution data for the pusher.

This step is entirely optional — without it, badges still update on their own once the cache expires.

---

## 🌐 Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JhaSourav07/commitpulse&env=GITHUB_TOKEN&envDescription=GitHub%20Personal%20Access%20Token%20with%20read%3Auser%20scope)

Set the `GITHUB_TOKEN` environment variable in your Vercel project settings, and you're live.

> **Note:** Both `GITHUB_TOKEN` and `GITHUB_PAT` are accepted. `GITHUB_TOKEN` is the canonical name used throughout the codebase; `GITHUB_PAT` works as an alias for backwards compatibility.
