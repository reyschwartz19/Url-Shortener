# URL Shortener

A full-stack URL shortening service with a React dashboard, built on TypeScript, Express, PostgreSQL, Prisma, and Redis. Create shortened URLs, track clicks with geolocation analytics, and manage your links through an authenticated SPA backed by a load-balanced API.

## Features

- **React Dashboard** — Landing page, auth flows, link management, and per-link analytics via a Vite-powered SPA
- **User Authentication** — JWT access + refresh token flow with httpOnly cookie rotation and in-memory token storage (XSS-safe)
- **URL Shortening** — Convert long URLs into unique 8-character short codes (nanoid) with collision-retry logic
- **Link Management** — Create, list, and soft-delete shortened links with Redis cache invalidation
- **Click Tracking** — Buffered click recording via Redis lists, flushed to PostgreSQL in batches by a background worker
- **Analytics** — Total clicks (Redis-cached), clicks grouped by country, and clicks over time
- **Redis-Backed Rate Limiting** — Tiered limiters for auth, token refresh, link creation, and redirect endpoints
- **URL Safety Validation** — SSRF protection blocking `localhost`, private IP ranges, and internal networks
- **Session Management** — Database-backed sessions with bcrypt-hashed refresh tokens and token rotation
- **Input Validation** — Zod schema validation for all API inputs
- **Centralized Error Handling** — Custom `AppError` hierarchy (`ValidationError`, `NotFoundError`, `ConflictError`, `ForbiddenError`, `UnauthorizedError`)
- **CI/CD Pipeline** — GitHub Actions for build verification and Docker Hub image publishing
- **Load-Balanced Deployment** — 3 backend instances behind Nginx with `least_conn` balancing

## Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4
- **Data Fetching**: TanStack React Query 5 + Axios
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React
- **State Management**: In-memory auth token store with automatic refresh interceptor

### Backend
- **Runtime**: Node.js (LTS Alpine)
- **Language**: TypeScript 6
- **Framework**: Express.js 5
- **Database**: PostgreSQL 15
- **ORM**: Prisma 7 (with PostgreSQL adapter)
- **Caching & Buffering**: Redis 7 (ioredis)
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **Rate Limiting**: express-rate-limit + rate-limit-redis
- **Validation**: Zod 4
- **Geolocation**: geoip-lite
- **Short Code Generation**: nanoid

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy / Load Balancer**: Nginx (least-conn, SSL termination)
- **CI/CD**: GitHub Actions → Docker Hub
- **Database Admin**: Adminer (local development)
- **Deployment**: 3 backend replicas with health-checked database dependency

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **Docker** & **Docker Compose** (for containerized setup)
- **PostgreSQL** 15+ (or use Docker Compose)

## Installation & Setup

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd urlShortener
   ```

2. **Backend setup**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the `backend/` directory:
   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=postgresql://username123:password123@localhost:5433/url_shortener
   JWT_SECRET=your-secure-jwt-secret-min-10-chars
   JWT_REFRESH_SECRET=your-secure-refresh-secret-min-10-chars
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

5. **Start the backend dev server**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:3000`

6. **Frontend setup** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on `http://localhost:3000` (proxied to backend via Vite)

### Docker Setup (Recommended)

1. **Build and start all services**
   ```bash
   docker-compose up -d
   ```

   This starts:
   - **PostgreSQL** (port 5433) — Main database with health checks
   - **Redis** (port 6379) — Caching, rate limiting, and click buffering
   - **Nginx** (ports 80, 443) — Reverse proxy and `least_conn` load balancer
   - **3 Backend Instances**:
     - `url-shortener-backend` (port 3004 → internal 3000)
     - `url-shortener-backend2` (port 3002 → internal 3000)
     - `url-shortener-backend3` (port 3003 → internal 3000)
   - **Adminer** (port 8081) — Database management UI

2. **Verify services**
   ```bash
   docker-compose ps
   ```

3. **View logs**
   ```bash
   docker-compose logs -f url-shortener-backend
   ```

4. **Stop services**
   ```bash
   docker-compose down
   ```

## Environment Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `NODE_ENV` | enum | No | `development`, `production`, or `test` (default: `development`) |
| `PORT` | number | No | Server port (default: `3000`) |
| `DATABASE_URL` | string | Yes | PostgreSQL connection string |
| `JWT_SECRET` | string | Yes | Secret for signing access tokens (min 10 chars) |
| `JWT_REFRESH_SECRET` | string | Yes | Secret for signing refresh tokens (min 10 chars) |
| `REDIS_URL` | string | No | Redis connection URL (auto-set in Docker: `redis://redis:6379`) |
| `APP_NAME` | string | No | Replica identifier (e.g. `app1`, `app2`, `app3`) |
| `LOAD_TEST` | boolean | No | Set to `"true"` to bypass redirect rate limiters during load testing |

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Rate Limited | Description |
|--------|----------|------|-------------|-------------|
| `POST` | `/api/auth/register` | No | ✅ 10 req/15min | Register a new user |
| `POST` | `/api/auth/login` | No | ✅ 10 req/15min | Login and receive tokens |
| `POST` | `/api/auth/refresh` | Cookie | ✅ 20 req/15min | Rotate refresh token, get new access token |
| `POST` | `/api/auth/logout` | Bearer | No | Revoke refresh token |

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
**Response**: `{ user: { id, email }, accessToken }` + httpOnly refresh token cookie

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
**Response**: `{ accessToken }` + httpOnly refresh token cookie

#### Refresh Token
```http
POST /api/auth/refresh
Cookie: refreshToken=<httpOnly-cookie>
```
**Response**: `{ accessToken, email }` + rotated httpOnly refresh token cookie

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access-token>
```
**Response**: `{ message: "Logged out successfully" }`

### Links (`/api/links`)

| Method | Endpoint | Auth | Rate Limited | Description |
|--------|----------|------|-------------|-------------|
| `POST` | `/api/links/createLink` | Bearer | ✅ 30 req/hr (per user) | Create a new short link |
| `GET` | `/api/links/userLinks` | Bearer | No | Get all links for the authenticated user |
| `GET` | `/api/links/:shortCode` | No | ✅ 60 req/min (IP) + 200 req/min (code) | Redirect to original URL |
| `DELETE` | `/api/links/:linkId` | Bearer | No | Soft-delete a link |

#### Create Short Link
```http
POST /api/links/createLink
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "originalUrl": "https://example.com/very/long/path"
}
```
**Response**: `{ linkId, shortCode, originalUrl }`

#### Redirect
```http
GET /api/links/:shortCode
```
**Response**: `302` redirect to original URL (records click asynchronously via Redis buffer)

### Click Analytics (`/api/clicks`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/clicks/:linkId/stats` | Bearer | Get click statistics for a link (owner only) |

**Response**:
```json
{
  "totalCount": 1250,
  "clicksByCountry": [
    { "country": "US", "count": 500 },
    { "country": "GB", "count": 230 }
  ],
  "clicksOverTime": [
    { "date": "2026-07-01", "count": 45 },
    { "date": "2026-07-02", "count": 78 }
  ]
}
```

### Health Check

```http
GET /health
```
**Response**: `{ status: "ok", app: "app1", timeStamp: "..." }`

## Database Schema

### User
| Column | Type | Constraints |
|--------|------|-------------|
| `userId` | UUID | Primary Key, auto-generated |
| `email` | String | Unique |
| `hashedPassword` | String | bcrypt hash |
| `createdAt` | DateTime | Default: now() |

### Link
| Column | Type | Constraints |
|--------|------|-------------|
| `linkId` | UUID | Primary Key, auto-generated |
| `userId` | String | FK → User, indexed |
| `originalUrl` | String | — |
| `shortCode` | String | Unique |
| `createdAt` | DateTime | Default: now() |
| `deletedAt` | DateTime? | Soft delete marker |

### Click
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | Primary Key, auto-generated |
| `linkId` | String | FK → Link, indexed |
| `clickedAt` | DateTime | Default: now() |
| `country` | String? | ISO country code (geoip-lite) |
| `ipHash` | String? | SHA-256 hash of visitor IP |

**Indexes**: `[linkId]`, `[linkId, country]` (composite for analytics queries)

### Session
| Column | Type | Constraints |
|--------|------|-------------|
| `sessionId` | UUID | Primary Key, auto-generated |
| `userId` | String | FK → User, indexed |
| `tokenHash` | String | Unique, bcrypt hash of refresh token |
| `createdAt` | DateTime | Default: now() |
| `expiresAt` | DateTime | 7-day TTL |

## Project Structure

```
urlShortener/
├── backend/
│   ├── src/
│   │   ├── server.ts                 # Express app entry point
│   │   ├── config/
│   │   │   ├── env.ts                # Environment validation (Zod)
│   │   │   ├── prisma.ts             # Prisma client singleton
│   │   │   └── redis.ts              # ioredis client
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts    # Register, login, refresh, logout
│   │   │   ├── link.controller.ts    # CRUD + redirect
│   │   │   └── click.controller.ts   # Analytics aggregation
│   │   ├── routes/
│   │   │   ├── auth.route.ts         # Auth routes + rate limiters
│   │   │   ├── link.route.ts         # Link routes + rate limiters
│   │   │   └── click.route.ts        # Stats routes
│   │   ├── services/
│   │   │   ├── userAuth.service.ts   # User registration & login
│   │   │   ├── links.service.ts      # Link CRUD with Redis caching
│   │   │   ├── click.service.ts      # Click recording & analytics
│   │   │   └── token.service.ts      # JWT signing, refresh rotation
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts     # JWT validation
│   │   │   ├── errorHandler.ts       # Global error handler
│   │   │   └── rateLimiters.ts       # Redis-backed rate limiters
│   │   ├── workers/
│   │   │   └── clickFlusher.ts       # Background click buffer → DB writer
│   │   ├── scripts/
│   │   │   └── seedScript.ts         # Faker-based load test seeder
│   │   ├── schema/
│   │   │   ├── authInput.schema.ts   # Auth input validation
│   │   │   └── link.schema.ts        # URL validation + SSRF protection
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   ├── link.types.ts
│   │   │   └── express.d.ts          # Express type extensions
│   │   ├── errors/
│   │   │   └── AppError.ts           # Custom error hierarchy
│   │   └── utils/
│   │       └── catchAsync.ts         # Async error wrapper
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── generated/prisma/             # Auto-generated Prisma client
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── package.json
│   ├── tsconfig.json
│   └── prisma.config.ts
├── frontend/
│   ├── src/
│   │   ├── App.tsx                   # Root component & view routing
│   │   ├── main.tsx                  # Entry point (React + QueryClient)
│   │   ├── index.css                 # Global styles
│   │   ├── components/
│   │   │   ├── LandingPage.tsx       # Marketing landing page
│   │   │   ├── AuthPage.tsx          # Login / Register forms
│   │   │   ├── Dashboard.tsx         # Link management dashboard
│   │   │   ├── AnalyticsPage.tsx     # Per-link click analytics
│   │   │   └── GlobeVisualizer.tsx   # Geographic click visualization
│   │   ├── hooks/
│   │   │   ├── useAuth.ts           # Login, register, logout mutations
│   │   │   ├── useLinks.ts          # Link CRUD queries & mutations
│   │   │   └── useAnalytics.ts      # Click analytics query
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios instance + auth interceptors
│   │   │   └── queryClient.ts       # TanStack Query client config
│   │   └── types/
│   │       └── api.ts               # API request/response types
│   ├── index.html
│   ├── vite.config.ts                # Vite + Tailwind + API proxy
│   ├── tsconfig.json
│   └── package.json
├── nginx/
│   └── nginx.conf                    # least_conn LB + SSL termination
├── certs/                            # Self-signed SSL certificates
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI build + Docker Hub publish
├── docker-compose.yaml
├── security_review.md                # Security audit findings
└── README.md
```

## Architecture

### Click Recording Pipeline

Clicks are not written directly to PostgreSQL on each redirect. Instead, they use a **buffered write-behind** pattern for high throughput:

```
Redirect Request
       ↓
  Record click → Redis RPUSH "click-buffer"
  Increment counter → Redis HINCRBY "meta:{shortCode}" clicks
       ↓
  [Background Worker: clickFlusher]
  Every 5s → LPOP up to 1000 items → Prisma createMany → PostgreSQL
```

### Load Balancing

```
Client Requests
       ↓
   [Nginx] (SSL Termination + Reverse Proxy)
   ↙    ↓    ↘         ← least_conn algorithm
Backend1  Backend2  Backend3
   ↖    ↓    ↙
   [PostgreSQL] ← Shared Database
   [Redis]      ← Shared Cache + Click Buffer + Rate Limit Store
```

- **Algorithm**: `least_conn` (routes to the backend with fewest active connections)
- **Failure Handling**: `max_fails=3 fail_timeout=30s` per upstream
- **SSL**: Terminated at Nginx with self-signed certificates

### Authentication Flow

```
Login/Register → Server returns:
  - Access token (15min) → stored in JS memory (not localStorage)
  - Refresh token (7 days) → httpOnly secure cookie

On 401 → Axios interceptor auto-refreshes once:
  - POST /api/auth/refresh (sends cookie)
  - Server rotates refresh token (old one deleted, new one issued)
  - Retries original request with new access token
```

### Rate Limiting Strategy

All rate limiters use Redis as a shared store (works across all 3 backend replicas):

| Limiter | Window | Max | Key | Scope |
|---------|--------|-----|-----|-------|
| `authLimiter` | 15 min | 10 | IP | Login & Register |
| `refreshLimiter` | 15 min | 20 | IP | Token refresh |
| `createLinkLimiter` | 1 hr | 30 | User ID (or IP) | Link creation |
| `redirectIpLimiter` | 1 min | 60 | IP | Redirect endpoint |
| `redirectCodeLimiter` | 1 min | 200 | Short code | Per-link abuse prevention |

### Redis Caching Strategy

| Key Pattern | Data | TTL | Purpose |
|-------------|------|-----|---------|
| `link:{shortCode}` | Serialized link object | 1 hour | Redirect lookup cache |
| `meta:{shortCode}` | Hash: `originalUrl`, `userId`, `clicks`, `createdAt` | Persistent | Click counter + metadata |
| `click-buffer` | List of JSON click objects | Flushed every 5s | Buffered click writes |
| `rate-limit:*` | Rate limit counters | Per window | Redis-backed rate limiting |

## Development Workflow

### Running in Development

**Backend:**
```bash
cd backend
npm run dev   # ts-node-dev with auto-reload
```

**Frontend:**
```bash
cd frontend
npm run dev   # Vite dev server with HMR, API proxy to backend
```

### Available Scripts

#### Backend (`backend/package.json`)
| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `ts-node-dev --respawn --transpile-only src/server.ts` | Development server |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/src/server.js` | Production server |
| `db:generate` | `prisma generate` | Generate Prisma Client |
| `db:migrate` | `prisma migrate dev` | Run database migrations |
| `db:studio` | `prisma studio` | Open Prisma Studio UI |

#### Frontend (`frontend/package.json`)
| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite --port=3000 --host=0.0.0.0` | Development server |
| `build` | `vite build` | Production build |
| `preview` | `vite preview` | Preview production build |
| `lint` | `tsc --noEmit` | Type checking |

### Database Management

```bash
# Run migrations
npx prisma migrate dev --name your_migration_name

# View database UI
npx prisma studio

# Reset database (⚠️ development only)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

### Load Test Seeding

Seed the database with fake data for load testing:
```bash
cd backend
npx tsx src/scripts/seedScript.ts
```
This creates **1,000 users** and **1,000,000 links** using Faker.js.

## CI/CD Pipeline

The project uses GitHub Actions (`.github/workflows/ci.yml`) with two jobs:

### 1. CI Job (on push & PRs to `main`)
- Spins up a PostgreSQL 15 service container
- Installs dependencies (`npm ci`)
- Generates Prisma client
- Builds the TypeScript backend

### 2. Docker Job (on push to `main` only)
- Depends on CI job passing
- Logs in to Docker Hub
- Builds and pushes the backend image:
  - `reyschwartz19/url-shortener-backend:latest`
  - `reyschwartz19/url-shortener-backend:<commit-sha>`

## Security Features

- ✅ **JWT Authentication** — Access (15min) + refresh (7 days) token flow
- ✅ **Token Rotation** — Refresh tokens are single-use and rotated on each refresh
- ✅ **httpOnly Cookies** — Refresh tokens stored in httpOnly cookies, access tokens in memory only
- ✅ **Password Hashing** — bcrypt with salt rounds
- ✅ **CORS Protection** — Whitelist-based origin validation with credentials
- ✅ **SSRF Protection** — URL validation blocks localhost, private IPs, and internal networks
- ✅ **Redis-Backed Rate Limiting** — Tiered limiters shared across all backend replicas
- ✅ **Input Validation** — Zod schema validation for all API inputs
- ✅ **IP Hashing** — Click data stored with SHA-256 hashed IPs
- ✅ **Error Sanitization** — Custom error handler prevents sensitive info leakage
- ✅ **Graceful Shutdown** — SIGTERM/SIGINT handlers flush buffered clicks before exit

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running: `docker-compose ps`
- Check port 5433 is not in use
- Access Adminer at `http://localhost:8081`

### Redis Connection Issues
- Verify Redis is running: `docker-compose ps`
- Check port 6379 is available
- Ensure `REDIS_URL` environment variable is set correctly
- Check Redis logs: `docker-compose logs redis`

### Prisma Migration Fails
```bash
# Reset migrations (development only)
npx prisma migrate reset

# Or manually deploy migrations
npx prisma migrate deploy
```

### Port Conflicts
| Service | Port |
|---------|------|
| Backend Instance 1 | 3004 |
| Backend Instance 2 | 3002 |
| Backend Instance 3 | 3003 |
| Nginx (HTTP) | 80 |
| Nginx (HTTPS) | 443 |
| PostgreSQL | 5433 |
| Redis | 6379 |
| Adminer | 8081 |
| Frontend Dev Server | 3000 |

### Load Balancer Issues
- Verify Nginx is running: `docker-compose ps`
- Check Nginx logs: `docker-compose logs nginx`
- Test config: `docker exec -it nginx nginx -t`
- Check upstream health: `docker-compose logs url-shortener-backend`

### Container Won't Start
```bash
docker-compose logs url-shortener-backend
```

### One Backend Instance Fails
- The `least_conn` balancer will route traffic to remaining healthy instances
- Check specific instance: `docker-compose logs url-shortener-backend2`
- Restart a specific service: `docker-compose up -d url-shortener-backend2`

## TODO / Future Enhancements

- [ ] Add comprehensive test suite (Jest/Vitest)
- [ ] QR code generation for short links
- [ ] Link expiration / TTL
- [ ] Custom short codes
- [ ] Bulk operations API
- [ ] Email verification
- [ ] Password reset flow
- [ ] Monitoring & alerting (Prometheus, Grafana)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Browser & device analytics (User-Agent parsing)
- [ ] Link click heatmaps
- [ ] Team / organization support

## License

ISC

## Contact & Contributions

For questions or contributions, please create an issue or submit a pull request.
