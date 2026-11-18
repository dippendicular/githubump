# GitHub Counter

A self-hosted GitHub profile view counter and customizable README badge generator built with Next.js and TypeScript.

githubvisitcounter lets you run your own profile view badge service instead of depending on a third-party counter. It exposes a lightweight SVG badge endpoint, stores counts in your chosen database, and includes a polished web UI for generating badge URLs and copy-ready HTML.

## Features

- Generate GitHub-compatible SVG profile view badges
- Store profile views in Upstash Redis, your own Redis server, or SQLite
- Count unique views with TTL-based deduplication to avoid refresh spam
- Customize badge label, color, username, style, count mode, and unique-view TTL
- Preview badges in the browser before copying them
- Copy ready-to-use HTML for a GitHub profile README
- Optional GitHub profile stats for followers, following, public repos, and total stars
- Lightweight API endpoint designed for README image embeds
- Works with any deployment platform that supports Next.js and environment variables

## How It Works

The app has two main parts:

1. A web interface where you enter a GitHub username and customize the badge.
2. An API route at `/api/profile-views` that increments the stored counter and returns an SVG badge.

When a badge is loaded in a README, GitHub requests the SVG image URL. That request hits the API, increments the stored count for the selected username, and returns the latest count as a badge image.

## Tech Stack

- Next.js
- Upstash Redis, standalone Redis, or SQLite
- GitHub REST API

## Requirements

- Node.js compatible with Next.js 16
- pnpm
- One counter backend: Upstash Redis, standalone Redis, or SQLite
- Optional GitHub personal access token for GitHub stats
- Optional admin token for resetting or setting counters

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Choose one [counter storage](#counter-storage) option below and set its variables in `.env.local`. Then run `pnpm dev` and open `http://localhost:3000`.

## Counter storage

Set these variables on the server. On Vercel, use **Project → Settings → Environment Variables** and redeploy. For local development, edit `.env.local`. On a self-hosted production server, configure them in the service that starts `pnpm start`. Store credentials privately.

### Upstash Redis

Use this option on Vercel or when you want a managed database. In Upstash, open your database’s **REST API** section and copy the URL and **read/write** token. Existing deployments using these variables can leave `COUNTER_STORAGE` unset. Upstash remains the default, and the existing `views:<username>` keys still work.

```dotenv
COUNTER_STORAGE=upstash
KV_REST_API_URL=https://your-database.upstash.io
KV_REST_API_TOKEN=your-read-write-token
```

### SQLite

Use this option on one self-hosted machine with Node.js 22.13 or newer. Pick a writable path on a persistent volume. The app creates the file and tables on first use. For local development, `./data/counters.sqlite` works. For production, mount a writable volume and use its absolute path. Keep one deployment using the file and back it up with SQLite’s backup facilities. Vercel Functions have ephemeral local storage, so use Upstash or external Redis there.

```dotenv
COUNTER_STORAGE=sqlite
COUNTER_SQLITE_PATH=./data/counters.sqlite
```

### Your own Redis

Run a standalone Redis instance on a private network reachable from the app. Enable persistence and use authentication. For local development with Docker, start a Redis container bound to loopback with a named data volume:

```bash
docker run -d --name github-counter-redis -p 127.0.0.1:6379:6379 \
  -v github-counter-redis:/data redis:8-alpine redis-server --appendonly yes
```

Then point the app to that local instance:

```dotenv
COUNTER_STORAGE=redis
REDIS_URL=redis://127.0.0.1:6379
```

For an authenticated remote instance that requires TLS, use its `rediss://username:password@host:port` connection URL. Percent-encode special characters in credentials. The app needs permission to run `EVAL`, `GET`, `SET`, `EXISTS`, `INCR`, and `EXPIRE`.

### Verify the connection

1. Restart or redeploy the app after saving your settings.
2. Open `/api/profile-views?username=storage-test&mode=total` twice. The second request should add one view.
3. Open `/api/profile-views/stats?username=storage-test` to read the exact count without incrementing it.
4. Set `ADMIN_API_TOKEN` to a random secret if you want to seed or reset counts through the [admin endpoint](#additional-api-endpoints). Set `GITHUB_API_TOKEN` only if you want GitHub stats.

Each backend has its own data. Before switching an existing badge to a different database, read its old count using the stats endpoint and seed the new database with the admin endpoint. Unique-visitor history starts fresh when the database changes.

## Badge Usage

Use the app UI to generate a badge, or build the URL manually:

```text
https://yourdomain.com/api/profile-views?username=yourname&label=Profile%20views&color=0e75b6&style=flat&mode=unique&ttl=21600
```

Add it to a GitHub README:

```html
<img src="https://yourdomain.com/api/profile-views?username=yourname&label=Profile%20views&color=0e75b6&style=flat&mode=unique&ttl=21600" alt="profile views" />
```

Markdown also works:

```md
![Profile views](https://yourdomain.com/api/profile-views?username=yourname&label=Profile%20views&color=0e75b6&style=flat&mode=unique&ttl=21600)
```

Replace `yourdomain.com` with the domain where you deploy the app, and replace `yourname` with the GitHub username or counter key you want to track.

## API Reference

### `GET /api/profile-views`

Returns an SVG badge and increments the counter for the provided `username`. By default, it counts a viewer once per TTL window instead of counting every refresh.

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `username` | string | `guest` | GitHub username or custom counter key |
| `label` | string | `Profile views` | Text shown on the left side of the badge |
| `color` | string | `0e75b6` | Hex color for the right side of the badge |
| `style` | string | `flat` | Badge style: `flat`, `flat-square`, `plastic`, `rounded`, `for-the-badge`, `social`, `pill`, `outline`, `terminal`, `minimal`, `ticket`, `ledger`, or `orbit` |
| `mode` | string | `unique` | Counting mode: `unique` deduplicates repeat viewers during the TTL window, while `total` increments on every request |
| `ttl` | number | `21600` | Unique-view deduplication window in seconds, clamped from `60` to `86400` |
| `preview` | boolean | `false` | When `true`, returns a sample badge without reading or writing Redis |

Example:

```text
/api/profile-views?username=dipcb05&label=Profile%20views&color=0e75b6&style=flat&mode=unique&ttl=21600
```

The API response uses:

- `Content-Type: image/svg+xml`
- `Cache-Control: no-cache, no-store, must-revalidate`

The no-cache headers help keep the displayed counter fresh when the badge is requested. Use `mode=total` only when you intentionally want every request, refresh, and image reload to increment the badge.


## Additional API Endpoints

### `GET /api/profile-views/stats`

Returns the stored counter value as JSON without incrementing it.

```text
/api/profile-views/stats?username=dipcb05
```

Example response:

```json
{ "username": "dipcb05", "views": 1234 }
```

### `POST /api/profile-views/admin`

Resets or sets a counter. This endpoint requires `ADMIN_API_TOKEN` and an `Authorization` header.

Reset a counter:

```bash
curl -X POST https://yourdomain.com/api/profile-views/admin \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"dipcb05","action":"reset"}'
```

Set a counter:

```bash
curl -X POST https://yourdomain.com/api/profile-views/admin \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"dipcb05","action":"set","count":1000}'
```

### `GET /api/github-stats`

Returns optional GitHub profile stats as JSON for the badge generator UI. It uses `GITHUB_API_TOKEN` on the server so the token is not exposed to browser code.

```text
/api/github-stats?username=dipcb05
```

## GitHub Stats

The badge counter works with any configured storage backend. GitHub stats are optional and are used by the web UI to show extra profile information.

With `GITHUB_API_TOKEN` configured, the app can fetch:

- Followers
- Following
- Public repositories
- Total stars across public repositories

If the token is missing or the GitHub API request fails, the badge generator still works.

## Scripts

```bash
pnpm dev
```

Start the local development server.

```bash
pnpm build
```

Create a production build.

```bash
pnpm start
```

Run the production build.

```bash
pnpm lint
```

Run linting.

## Deployment

Deploy on a Node.js host and configure one [counter storage](#counter-storage) backend. Your badge endpoint needs a public HTTPS URL so GitHub can load the image.

After deployment, use your production domain in the badge URL:

```text
https://yourdomain.com/api/profile-views?username=yourname
```

## Project Structure

```text
app/
  api/profile-views/route.ts        SVG badge API route
  api/profile-views/stats/route.ts  JSON count endpoint
  api/profile-views/admin/route.ts  authenticated counter admin endpoint
  api/github-stats/route.ts         server-side GitHub stats endpoint
  layout.tsx                  Root metadata and layout
  page.tsx                    Home page
components/
  badge-generator.tsx         Main badge generator UI
components/ui/
  button.tsx                  Shared button component
lib/
  badge-utils.ts              Badge URL, number formatting, and embed helpers
  github-stats.ts             Optional GitHub API helpers
public/
  icons and public assets
```

## Troubleshooting

If the badge returns an error, check that the selected backend’s variables and connection are correct. The sample preview works without storage.

If the badge works locally but not in a GitHub README, make sure the deployed URL is public and returns an SVG when opened directly in the browser.

If GitHub stats do not show in the UI, confirm that `GITHUB_API_TOKEN` is configured and has access to public user and repository data.

If the counter appears stale on GitHub, wait a few minutes. GitHub may cache external images even when the API response asks clients not to cache them.

## License

MIT. See [LICENSE](./LICENSE).
