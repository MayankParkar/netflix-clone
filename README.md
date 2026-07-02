# STREAMR — Self-Hosted Netflix Clone

A full-stack video streaming platform built as a portfolio project, demonstrating end-to-end software engineering from local development through cloud deployment.

![STREAMR Screenshot](https://via.placeholder.com/800x400?text=STREAMR+Netflix+Clone)

## Architecture
## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 19 + TypeScript + Tailwind CSS | Industry standard, type-safe, utility-first styling |
| Backend | Node.js + Express + TypeScript | Shared language across stack, non-blocking I/O |
| Database | SQLite → PostgreSQL (Phase 2) | Zero-config locally, Prisma abstracts the switch |
| ORM | Prisma 6 | Type-safe queries, schema migrations, DB agnostic |
| Auth | JWT (access + refresh tokens) | Stateless, scales horizontally without shared session store |
| Video | HTTP Range Requests + FFmpeg | Native browser support, efficient byte-range serving |
| Metadata | TMDB API | Free, comprehensive movie database |
| Container | Docker + Docker Compose | Identical environments across dev/staging/production |
| Cloud | AWS EC2 + S3 | Free tier, industry standard |

## Features

- Browse and search 13+ movies with real TMDB posters and metadata
- HTTP Range Request video streaming with seek support (206 Partial Content)
- JWT authentication — signup, login, logout, refresh tokens
- Protected streaming routes — only authenticated users can watch
- Automatic HDD scanning and TMDB metadata enrichment
- Containerised with Docker — runs with one command
- Responsive Netflix-style UI with hero banner, movie rows, video player

## Quick Start

### Prerequisites
- Docker and Docker Compose
- External HDD mounted at `/media/seagate`
- TMDB API key (free at themoviedb.org)

### Run locally

```bash
git clone https://github.com/MayankParkar/netflix-clone.git
cd netflix-clone

# Add your secrets
cp backend/.env.example backend/.env
# Edit backend/.env with your TMDB_API_KEY and JWT secrets

# Start everything
docker compose up -d

# Scan your HDD for video files
curl -X POST http://localhost:3000/api/v1/movies/scan

# Enrich with TMDB metadata (posters, ratings, descriptions)
curl -X POST http://localhost:3000/api/v1/movies/enrich

# Open the app
open http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/v1/auth/signup | No | Create account |
| POST | /api/v1/auth/login | No | Login, returns JWT tokens |
| POST | /api/v1/auth/refresh | No | Refresh access token |
| GET | /api/v1/movies | No | List all movies |
| GET | /api/v1/movies/search?q= | No | Search movies |
| GET | /api/v1/movies/:id | No | Get movie details |
| GET | /api/v1/movies/:id/stream | **Yes** | Stream video (Range Requests) |
| POST | /api/v1/movies/scan | No | Scan HDD for video files |
| POST | /api/v1/movies/enrich | No | Fetch TMDB metadata |

## System Design

### How would you scale this to 10 million users?

**Phase 1 (current)**: Monolith on a single machine. SQLite database. Video files on local HDD.

**Phase 2 (AWS Free Tier)**: Express on EC2 t2.micro. PostgreSQL on RDS. Static frontend on S3 + CloudFront CDN.

**Phase 3 (growth)**: Load balancer in front of multiple EC2 instances. RDS read replicas. Video files on S3, served through CloudFront signed URLs. Redis caching for movie metadata.

**Phase 4 (Netflix scale)**: Break monolith into microservices (auth, catalog, streaming, recommendations). Kafka for event streaming. DynamoDB for watch history (high write throughput). Custom CDN with edge servers physically co-located inside ISPs (like Netflix Open Connect).

### Key engineering decisions

**SQLite over PostgreSQL locally**: Zero infrastructure setup, Prisma abstracts the difference. Migration is one config line.

**Monolith over microservices**: Simpler to develop, test, and deploy at this scale. Premature microservices add complexity without solving real problems.

**JWT over sessions**: Stateless tokens scale horizontally — any server instance can verify any token without shared state. Access tokens expire in 15 minutes, refresh tokens last 7 days.

**HTTP Range Requests over pre-chunking**: Native browser support, no pre-processing needed. The `<video>` element handles all the chunking logic automatically.

## Development

```bash
# Backend only (without Docker)
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev

# Run tests
cd backend && npm test
```

## Deployment

See [AWS Deployment Guide](docs/aws-deployment.md) for full EC2 + S3 deployment instructions.

## License

MIT — built as a portfolio/learning project.
