# URL Shortener

A full-stack URL shortening service built with TypeScript, Express, PostgreSQL, and Prisma. Create shortened URLs, track clicks with geolocation data, and manage your links through a RESTful API with JWT authentication.

## Features

- **User Authentication**: Secure signup and login with JWT tokens (access + refresh tokens)
- **URL Shortening**: Convert long URLs into unique, short codes
- **Link Management**: Create, retrieve, and delete shortened links
- **Click Tracking**: Monitor every click with geolocation data and IP information
- **Analytics**: Get detailed statistics for each shortened link
- **Session Management**: Secure session handling with token expiration and refresh
- **Input Validation**: Zod schema validation for all API inputs
- **Error Handling**: Centralized error handling with custom error types
- **CORS Support**: Ready for frontend integration

## Tech Stack

### Backend
- **Runtime**: Node.js (LTS Alpine)
- **Language**: TypeScript
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL 15
- **ORM**: Prisma 7.x (with PostgreSQL adapter)
- **Caching**: Redis 7.x
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Password Hashing**: bcrypt
- **Geolocation**: geoip-lite
- **Utilities**: nanoid (for short code generation), cookie-parser, ioredis

### DevTools
- **Dev Server**: ts-node-dev
- **Testing**: (To be configured)
- **Type Checking**: TypeScript 6.x

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Load Balancing**: Nginx (Reverse proxy)
- **Database Admin UI**: Adminer (for local development)
- **Multiple Deployment**: 3 backend instances with load balancing

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **Docker** & **Docker Compose** (for containerized setup)
- **PostgreSQL** 15+ (or use Docker Compose)
- **.env** configuration file with required environment variables

## Installation & Setup

### Local Development Setup

1. **Clone and Navigate**
   ```bash
   cd /home/rey/Projects/urlShortener
   cd backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the `backend/` directory:
   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=postgresql://username123:password123@localhost:5433/url_shortener
   JWT_SECRET=your-secure-jwt-secret-min-10-chars
   JWT_REFRESH_SECRET=your-secure-refresh-secret-min-10-chars
   ```

4. **Set Up Database**
   ```bash
   # Run database migrations
   npx prisma migrate deploy
   
   # Generate Prisma Client
   npx prisma generate
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:3000`

### Docker Setup (Recommended)

1. **Build and Start Services**
   ```bash
   docker-compose up -d
   ```

   This starts:
   - **PostgreSQL** (port 5433): Main database
   - **Redis** (port 6379): Caching layer
   - **Nginx** (ports 80, 443): Reverse proxy and load balancer
   - **Backend Instances** (3 instances):
     - `url-shortener-backend` (port 3004, internal 3000)
     - `url-shortener-backend2` (port 3002, internal 3000)
     - `url-shortener-backend3` (port 3003, internal 3000)
   - **Adminer** (port 8081): Database management UI

2. **Verify Services**
   ```bash
   docker-compose ps
   ```

3. **View Logs**
   ```bash
   docker-compose logs -f url-shortener-backend
   ```

4. **Stop Services**
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
| `REDIS_URL` | string | No | Redis connection URL (e.g., `redis://redis:6379`). Auto-set in Docker. |

## API Endpoints

### Authentication (`/api/auth`)

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
**Response**: User ID, email, and tokens

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
**Response**: Access token, refresh token, user info

#### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer <refresh-token>
```
**Response**: New access token

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access-token>
```
**Response**: Success confirmation

### Links (`/api/links`)

#### Create Short Link
```http
POST /api/links/createLink
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "originalUrl": "https://very-long-url-example.com/path/to/resource"
}
```
**Response**: Link object with `linkId`, `shortCode`, `originalUrl`, `createdAt`

#### Get User's Links
```http
GET /api/links/userLinks
Authorization: Bearer <access-token>
```
**Response**: Array of user's links

#### Redirect to Original URL
```http
GET /api/links/:shortCode
```
**Response**: 302 redirect to original URL (records click data)

#### Delete Link
```http
DELETE /api/links/:linkId
Authorization: Bearer <access-token>
```
**Response**: Success confirmation

### Click Analytics (`/api/clicks`)

#### Get Link Statistics
```http
GET /api/clicks/:linkId/stats
Authorization: Bearer <access-token>
```
**Response**: Click statistics including:
- Total clicks
- Clicks by country
- Recent clicks with timestamps and geolocation data

## Database Schema

### User
```
- userId (UUID, Primary Key)
- email (String, Unique)
- hashedPassword (String)
- createdAt (DateTime)
- links (One-to-Many relationship)
- sessions (One-to-Many relationship)
```

### Link
```
- linkId (UUID, Primary Key)
- userId (String, Foreign Key → User)
- originalUrl (String)
- shortCode (String, Unique)
- createdAt (DateTime)
- deletedAt (DateTime, nullable - soft delete)
- user (Many-to-One relationship)
- clicks (One-to-Many relationship)
```

### Click
```
- id (UUID, Primary Key)
- linkId (String, Foreign Key → Link)
- clickedAt (DateTime)
- country (String, nullable)
- ipHash (String, nullable)
- link (Many-to-One relationship)
```

### Session
```
- sessionId (UUID, Primary Key)
- userId (String, Foreign Key → User)
- tokenHash (String, Unique)
- createdAt (DateTime)
- expiresAt (DateTime)
- user (Many-to-One relationship)
```

## Project Structure

```
urlShortener/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Express app entry point
│   │   ├── config/
│   │   │   ├── env.ts             # Environment validation (Zod)
│   │   │   ├── prisma.ts          # Prisma client instance
│   │   │   └── redis.ts           # Redis client configuration
│   │   ├── controllers/           # Request handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── link.controller.ts
│   │   │   └── click.controller.ts
│   │   ├── routes/                # API route definitions
│   │   │   ├── auth.route.ts
│   │   │   ├── link.route.ts
│   │   │   └── click.route.ts
│   │   ├── services/              # Business logic
│   │   │   ├── userAuth.service.ts
│   │   │   ├── links.service.ts
│   │   │   ├── click.service.ts
│   │   │   └── token.service.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts # JWT validation
│   │   │   └── errorHandler.ts    # Global error handler
│   │   ├── schema/                # Zod validation schemas
│   │   │   ├── authInput.schema.ts
│   │   │   └── link.schema.ts
│   │   ├── types/                 # TypeScript type definitions
│   │   │   ├── auth.types.ts
│   │   │   ├── link.types.ts
│   │   │   └── express.d.ts       # Express extensions
│   │   ├── errors/
│   │   │   └── AppError.ts        # Custom error class
│   │   └── utils/
│   │       └── catchAsync.ts      # Async error wrapper
│   ├── prisma/
│   │   ├── schema.prisma          # Prisma schema definition
│   │   └── migrations/            # Database migrations
│   ├── generated/
│   │   └── prisma/                # Auto-generated Prisma types
│   ├── Dockerfile
│   ├── entrypoint.sh              # Container startup script
│   ├── package.json
│   ├── tsconfig.json
│   └── prisma.config.ts
├── nginx/
│   └── nginx.conf                 # Nginx reverse proxy & load balancer config
├── certs/                         # SSL/TLS certificates
├── docker-compose.yaml            # Multi-container orchestration (3 backend instances + load balancing)
└── README.md                       # This file
```

## Development Workflow

### Running in Development Mode

```bash
cd backend
npm run dev
```

This uses `ts-node-dev` to:
- Auto-reload on file changes
- Transpile TypeScript on-the-fly
- Maintain fast development experience

### Building for Production

```bash
cd backend
npm run build
```

Compiles TypeScript to JavaScript in the `dist/` directory.

### Starting Production Server

```bash
cd backend
npm start
```

Runs the compiled JavaScript from `dist/src/server.js`.

### Database Management

**Run Migrations**:
```bash
npx prisma migrate dev --name your_migration_name
```

**View Database UI**:
```bash
npx prisma studio
```

**Reset Database** (⚠️ Development only):
```bash
npx prisma migrate reset
```

**Generate Prisma Client**:
```bash
npx prisma generate
```

## Docker Compose Services

### urlshortener-db
- **Image**: postgres:15
- **Port**: 5433 (maps to 5432 inside container)
- **Credentials**: 
  - User: `username123`
  - Password: `password123`
- **Database**: `url_shortener`
- **Volume**: `urlShortener-data` (persists between restarts)
- **Restart Policy**: unless-stopped

### redis
- **Image**: redis:latest
- **Port**: 6379
- **Purpose**: Caching layer for session and data storage
- **Volume**: `redis-data` (persists between restarts)
- **Features**: AOF (Append-Only File) persistence enabled
- **Restart Policy**: unless-stopped

### nginx
- **Image**: nginx:alpine
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Purpose**: Reverse proxy and load balancer
- **Configuration**: [nginx/nginx.conf](nginx/nginx.conf)
- **SSL/TLS Certificates**: Located in `./certs/` directory
- **Routes To**: All 3 backend instances with load balancing

### adminer
- **Image**: adminer:latest
- **Port**: 8081
- **Purpose**: Web-based database management UI
- **Access**: `http://localhost:8081`
- **Restart Policy**: unless-stopped

### url-shortener-backend (Instance 1)
- **Build**: `./backend/Dockerfile`
- **Port**: 3004 (external) → 3000 (internal)
- **Environment**: 
  - `REDIS_URL`: redis://redis:6379
  - `APP_NAME`: app1
- **Dependencies**: Database, Redis
- **Restart Policy**: unless-stopped

### url-shortener-backend2 (Instance 2)
- **Build**: `./backend/Dockerfile`
- **Port**: 3002 (external) → 3000 (internal)
- **Environment**: 
  - `REDIS_URL`: redis://redis:6379
  - `APP_NAME`: app2
- **Dependencies**: Database, Redis, Nginx
- **Restart Policy**: unless-stopped

### url-shortener-backend3 (Instance 3)
- **Build**: `./backend/Dockerfile`
- **Port**: 3003 (external) → 3000 (internal)
- **Environment**: 
  - `REDIS_URL`: redis://redis:6379
  - `APP_NAME`: app3
- **Dependencies**: Database, Redis, Nginx
- **Restart Policy**: unless-stopped

**Load Balancing**: Nginx distributes incoming requests across all 3 backend instances for high availability and scalability.

## Error Handling

The API uses a centralized error handler that returns consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

Custom error types are defined in [AppError.ts](backend/src/errors/AppError.ts).

## CORS Configuration

The backend is configured to accept requests with:
- **Methods**: GET, POST, PUT, DELETE
- **Headers**: Content-Type, Authorization
- **Credentials**: Enabled

When using Docker with Nginx:
- Requests are routed through Nginx on ports 80 (HTTP) and 443 (HTTPS)
- Update the CORS origin in [server.ts](backend/src/server.ts) to match your frontend domain
- For local development, Nginx is configured to proxy requests to all 3 backend instances

## Load Balancing Architecture

The application uses a **3-tier load-balanced deployment**:

```
Client Requests
       ↓
   [Nginx] (Reverse Proxy & Load Balancer)
   ↙    ↓    ↘
Backend1  Backend2  Backend3
   ↖    ↓    ↙
   [PostgreSQL DB] ← Shared Database
   [Redis] ← Shared Cache
```

**Benefits**:
- **High Availability**: If one backend fails, traffic routes to others
- **Scalability**: Add more backend instances easily
- **Performance**: Requests distributed across multiple instances
- **Caching**: Redis shared cache for all instances
- **Session Consistency**: Database-backed sessions work across instances

**Nginx Configuration**:
- Load balancing algorithm: Round-robin (default)
- Health checks: Can be configured in [nginx/nginx.conf](nginx/nginx.conf)
- SSL/TLS termination: Handled by Nginx

## Input Validation

All API inputs are validated using Zod schemas:
- **Auth Schemas**: Email format, password strength
- **Link Schemas**: URL format validation

Validation schemas are located in [backend/src/schema/](backend/src/schema/)

## Caching with Redis

Redis is integrated for:
- **Session Management**: Store session tokens and user data
- **Rate Limiting**: Prevent abuse by tracking request counts
- **Data Caching**: Cache frequently accessed links and analytics
- **Distributed Cache**: Shared across all 3 backend instances

**Configuration**: Set `REDIS_URL` environment variable (auto-configured in Docker)

**Access**:
- Local development: `redis://localhost:6379`
- Docker: `redis://redis:6379`

## Security Features

- ✅ **JWT Authentication**: Access and refresh token flow
- ✅ **Password Hashing**: bcrypt with salt rounds
- ✅ **CORS Protection**: Whitelist-based origin validation
- ✅ **Input Validation**: Zod schema validation
- ✅ **Error Handling**: No sensitive info leakage
- ✅ **Session Management**: Token expiration and refresh
- ✅ **IP Hashing**: Click data stored with hashed IPs

## TODO / Future Enhancements

- [ ] Add comprehensive test suite (Jest/Mocha)
- [ ] Implement advanced rate limiting with Redis
- [ ] QR code generation for short links
- [ ] Link expiration
- [ ] Bulk operations API
- [ ] Admin dashboard
- [ ] Analytics visualizations
- [ ] Email verification
- [ ] Password reset flow
- [ ] Monitoring and alerting (Prometheus, Grafana)
- [ ] API documentation (Swagger/OpenAPI)


## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running: `docker-compose ps`
- Check port 5433 is not in use
- Ensure Adminer can connect at `http://localhost:8081`

### Redis Connection Issues
- Verify Redis is running: `docker-compose ps`
- Check port 6379 is available
- Ensure `REDIS_URL` environment variable is set correctly
- Check Redis logs: `docker-compose logs redis`

### Prisma Migration Fails
```bash
# Reset migrations (development only)
npx prisma migrate reset

# Or manually run migrations
npx prisma migrate deploy
```

### Port Already in Use
- Backend instances use ports 3002, 3003, 3004 (external mapping to 3000 internal)
- Nginx uses ports 80 and 443
- Redis uses port 6379
- PostgreSQL uses port 5433
- Adminer uses port 8081

Change ports in `docker-compose.yaml` or kill the process using the port.

### Load Balancer Issues (Nginx)
- Verify Nginx is running: `docker-compose ps`
- Check Nginx logs: `docker-compose logs nginx`
- Verify backend instances are healthy: `docker-compose logs url-shortener-backend`
- Check Nginx configuration: `docker exec -it nginx nginx -t`

### Container Won't Start
Check logs: `docker-compose logs url-shortener-backend`

### One Backend Instance Fails
- The load balancer will route traffic to the remaining healthy instances
- Check specific instance: `docker-compose logs url-shortener-backend2`
- Restart a specific service: `docker-compose up -d url-shortener-backend2`

## License

ISC

## Contact & Contributions

For questions or contributions, please create an issue or submit a pull request.
