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
- **ORM**: Prisma 7.x
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Password Hashing**: bcrypt
- **Geolocation**: geoip-lite
- **Utilities**: nanoid (for short code generation), cookie-parser

### DevTools
- **Dev Server**: ts-node-dev
- **Testing**: (To be configured)
- **Type Checking**: TypeScript 6.x

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Database Admin UI**: Adminer (for local development)

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
   - **Adminer** (port 8080): Database management UI
   - **Backend API** (port 3000): Express server

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
│   │   │   └── prisma.ts          # Prisma client instance
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
├── docker-compose.yaml            # Multi-container setup
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

### adminer
- **Image**: adminer:latest
- **Port**: 8080
- **Purpose**: Web-based database management UI
- **Access**: `http://localhost:8080`

### url-shortener-backend
- **Build**: `./backend/Dockerfile`
- **Port**: 3000
- **Dependencies**: Waits for database to be ready via entrypoint.sh

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

The backend is configured to accept requests from:
- **Frontend**: `http://localhost:5173` (default Vite dev server)
- **Methods**: GET, POST, PUT, DELETE
- **Headers**: Content-Type, Authorization
- **Credentials**: Enabled

Update the CORS origin in [server.ts](backend/src/server.ts) for production deployments.

## Input Validation

All API inputs are validated using Zod schemas:
- **Auth Schemas**: Email format, password strength
- **Link Schemas**: URL format validation

Validation schemas are located in [backend/src/schema/](backend/src/schema/)

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
- [ ] Implement rate limiting
- [ ] Add caching layer (Redis)
- [ ] QR code generation for short links
- [ ] Link expiration
- [ ] Bulk operations API
- [ ] Admin dashboard
- [ ] Analytics visualizations
- [ ] Email verification
- [ ] Password reset flow


## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running: `docker-compose ps`
- Check port 5433 is not in use

### Prisma Migration Fails
```bash
# Reset migrations (development only)
npx prisma migrate reset

# Or manually run migrations
npx prisma migrate deploy
```

### Port Already in Use
Change the port in `backend/.env` or `docker-compose.yaml`, or kill the process using the port.

### Container Won't Start
Check logs: `docker-compose logs url-shortener-backend`

## License

ISC

## Contact & Contributions

For questions or contributions, please create an issue or submit a pull request.
