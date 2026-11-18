<img width="560" alt="githubump" src="https://github.com/user-attachments/assets/b5c33b85-d75a-4989-b920-09c8768dec04" />

A little badge for your README, with a counter you run yourself

githubump makes SVG view badges for GitHub, GitLab, Forgejo, Gitea, and Codeberg. 

Pick a style, change the colors, drag the numbers into place, and copy the Markdown. You can put the public repo count beside the view count, too. A tiny badge can have a little personality.

<img width="588" height="590" alt="image" src="https://github.com/user-attachments/assets/f49de37e-45ea-439f-8061-7b3170a626d6" />

## How the counter works

- **Unique views** is the default. githubump hashes the username, IP address, and user agent it sees on the request. If that fingerprint comes back for the same counter within six hours, the badge shows the current number without adding another view. Set `ttl` to change the window.
- **Every request** (`mode=total`) adds one each time the badge endpoint receives a request. That includes direct opens, reloads that reach the server, and requests from bots.

The number reflects the requests that reach your server. An image proxy can serve a cached badge without making a fresh request, and multiple visitors behind a proxy can look alike in unique mode. Think of it as a badge counter for your README.

## Run it locally

Use Node.js 22.13 or newer and pnpm. SQLite is the quickest way to try it. Install the dependencies and copy the sample environment file.

```bash
pnpm install
cp .env.example .env.local
```

Set these values in `.env.local`.

```dotenv
COUNTER_STORAGE=sqlite
COUNTER_SQLITE_PATH=./data/counters.sqlite
```

Run `pnpm dev` and open `http://localhost:3000`. The app creates the database on first use.

To check that storage works, open `/api/profile-views?username=storage-test&mode=total` twice. Then open `/api/profile-views/stats?username=storage-test`. The stored count should have gone up by two.

## Choose your storage

Use `.env.local` for local development and set the same variables in your runtime environment when deploying. Keep credentials on the server.

### SQLite

Use SQLite for a single app instance with a writable, persistent disk. Set `COUNTER_STORAGE=sqlite` and point `COUNTER_SQLITE_PATH` at the database file. In production, use an absolute path on the persistent volume and back up that file with SQLite's backup tools.

### Standalone Redis

Use a Redis instance reachable from the app. Enable persistence if you want counts to survive Redis restarts.

```dotenv
COUNTER_STORAGE=redis
REDIS_URL=redis://127.0.0.1:6379
```

Use a `rediss://` URL for a server that requires TLS. The Redis account needs permission to run `EVAL`, `GET`, `SET`, `EXISTS`, `INCR`, and `EXPIRE`.

### Upstash Redis

Use the REST API URL and read/write token from your Upstash database.

```dotenv
COUNTER_STORAGE=upstash
KV_REST_API_URL=https://your-database.upstash.io
KV_REST_API_TOKEN=your-read-write-token
```

Existing Upstash deployments can leave `COUNTER_STORAGE` unset. The app still reads the existing GitHub counter keys.

Each backend has its own data. If you move an existing badge to a new backend, read its exact count through the stats endpoint first, then seed that value through the admin endpoint. The new backend starts with a fresh deduplication history.

## Deploy it

Run the app on a host that supports Next.js and give it a public HTTPS URL so README image fetches can reach it. For a Node.js server, build and start it with these commands.

```bash
pnpm build
pnpm start
```

Use SQLite when the app runs as a single instance with persistent storage. Use an external Redis backend when the app runs on multiple instances or the local filesystem is ephemeral.

`GITHUB_API_TOKEN` is optional. It enables the extra GitHub profile stats in the editor and raises the rate limit for GitHub repo lookups. Set `ADMIN_API_TOKEN` if you want to seed or reset counters through the admin API.

## Put a badge in your README

Open the editor, pick a platform, and enter your handle. Choose a style, then use **Appearance** to tweak the font, shape, colors, and icon. **Move label & count** lets you drag the text or nudge it with the arrow keys. When it looks right, copy the Markdown, HTML, or URL.

The editor reads the stored number without adding a view, so you can fiddle with the colors all afternoon.

Here's a GitLab badge with public repositories enabled. Replace `badges.example.com` with your deployment's hostname and `alice` with your handle.

```md
![GitLab profile views](https://badges.example.com/api/profile-views?platform=gitlab&username=alice&style=flat&showRepos=true)
```

## API

### `GET /api/profile-views`

Returns an SVG badge. These are the parameters you'll use most often.

| Parameter | What it does |
| --- | --- |
| `platform` | `github`, `gitlab`, `forgejo`, `gitea`, or `codeberg`. Defaults to `github`. |
| `username` | Profile handle. Defaults to `guest` when omitted. |
| `mode` | `unique` for deduplicated views, or `total` for every request. Defaults to `unique`. |
| `ttl` | Deduplication window in seconds. Defaults to `21600` and is clamped to `60`–`86400`. |
| `preview` | Use `stored` for the current count or `true` for a sample count. Both leave the counter alone. |
| `showRepos` | Set to `true` to include the public repository count. |
| `repoOrder` | `views-first` or `repos-first`. |
| `countFormat` | `exact` for a number like `17,654` or `compact` for `17.7K`. |
| `label`, `style`, `color` | Set the badge text, style, and count background color. |
| `shape`, `font`, `icon`, `labelColor`, `countColor` | Customize the badge. The repository badge has its own controls in the editor. |
| `labelPosition`, `countPosition` | Text offsets as `x,y` percentages, from −25 to 25 per axis. |

For appearance options, the easiest reference is the URL the editor generates. Bundled fonts are embedded in the SVG, and you can search Font Awesome Free icons from the picker.

### Read counts and profile data

| Route | Returns |
| --- | --- |
| `GET /api/profile-views/stats?username=alice&platform=gitlab` | Exact stored view count |
| `GET /api/views/gitlab/alice` | Stored view count for a platform and handle |
| `GET /api/public-repositories/codeberg/alice` | Public repository count from the provider |
| `GET /api/github-stats?username=alice` | Optional GitHub profile stats such as followers and public repo stars |

### Set or reset a count

`POST /api/profile-views/admin` requires `Authorization: Bearer <ADMIN_API_TOKEN>`. Pass `username`, an `action` of `set` or `reset`, and a `count` for `set`. Include `platform` for a counter outside GitHub.

```bash
curl -X POST https://badges.example.com/api/profile-views/admin \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"platform":"gitlab","username":"alice","action":"set","count":1000}'
```
