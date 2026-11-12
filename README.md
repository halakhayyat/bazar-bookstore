
# Bazar Bookstore - Distributed Systems Lab 1

## Project Overview

A distributed bookstore implemented using three independent Node.js microservices, Docker containers, and SQLite databases.

## Services

| Service | Port | Responsibility |
|---------|------|----------------|
| Frontend | 5000 | Handles client search, info, and purchase requests |
| Catalog | 5001 | Manages book information, prices, and inventory |
| Order | 5002 | Processes purchases and records orders |

## Architecture

Client -> Frontend -> Catalog (search/info)

Client -> Frontend -> Order -> Catalog (purchase)

## Technologies

- Node.js
- Express.js
- SQLite
- Axios
- Docker
- Docker Compose

## How to Run

Requirements: Docker Desktop with Linux containers enabled.

From the project root:

```bash
docker compose up -d --build
```

Check services:

```bash
docker compose ps
```

## API Endpoints

### Frontend

- GET /search/:topic
- GET /info/:id
- POST /purchase/:id

### Catalog

- GET /search/:topic
- GET /info/:id
- GET /query/:id
- PUT /update/:id

## Example Requests

Search:

```bash
curl "http://localhost:5000/search/distributed%20systems"
```

Book information:

```bash
curl "http://localhost:5000/info/1"
```

Purchase:

```bash
curl -X POST "http://localhost:5000/purchase/1"
```

## Persistence

Catalog and Order use SQLite databases stored in Docker named volumes.

## Testing

The following tests were completed successfully:

- Search books by topic
- Retrieve book information
- Purchase a book
- Verify inventory decrement
- Reject purchases of nonexistent books
- Reject updates causing negative inventory
- Verify catalog data persists after container restart

## Stop Services

```bash
docker compose down
```

Do not use `docker compose down -v` unless you intend to delete stored database volumes.
